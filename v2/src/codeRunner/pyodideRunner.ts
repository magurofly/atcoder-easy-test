import Result from "./Result";
import Options from "./Options";
import CustomRunner from "./CustomRunner";
import config from "../config";
import pSite from "../site";
import { events } from "../util";
import workerCode from "./pyodideWorker.txt";

config.registerText("codeRunner.pyodideRunner.requirements", `["ac-library-python"]`, "packages as JSON array of strings (cf. https://micropip.pyodide.org/en/stable/project/api.html#micropip.install)");
config.registerText("codeRunner.pyodideRunner.timeout", "5000", "code execution timeout [ms]");

class PyodideWorker {
  worker: Worker;
  taskStates: Map<number, TaskState>;
  runId: number;

  constructor() {
    this.taskStates = new Map();
    this.worker = this.createWorker();
    this.runId = 0;
  }

  createWorker(onready: Function | null = null) {
    const blob = new Blob([new TextEncoder().encode(workerCode)], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url, { type: "module" });
    URL.revokeObjectURL(url);
    worker.onmessage = () => {
      worker.postMessage({
        type: "install",
        data: config.get<string[]>("codeRunner.pyodideRunner.requirements", ["ac-library-python"]),
      });
      worker.onmessage = this.onmessage.bind(this);
      if (onready) {
        onready();
      }
    };
    return worker;
  }

  onmessage(event: MessageEvent) {
    const { runId, type, data } = event.data;
    const taskState = this.taskStates.get(runId) as TaskState;
    switch (type) {
      case "start": {
        const timeout = config.get<number>("codeRunner.pyodideRunner.timeout", 5000);
        taskState.killTimer = setTimeout(() => {
          if (taskState.killTimer === undefined) {
            return;
          }
          taskState.killTimer = undefined;
          this.taskStates.delete(runId);

          taskState.callback?.call(null, {
            status: "TLE",
            exitCode: "",
            execTime: Date.now() - data.startTime,
            input: taskState.input,
            output: taskState.output,
            error: taskState.error,
          });
          
          // terminate worker, reinit and re-run queued codes
          this.worker.terminate();
          this.worker = this.createWorker(() => {
            for (const [runId, taskState] of this.taskStates) {
              this.worker.postMessage({
                type: "run",
                data: {
                  runId,
                  sourceCode: taskState.sourceCode,
                  input: taskState.input,
                },
              });
            }
          });
        }, timeout);
        break;
      }
      case "output": {
        taskState.output += data;
        break;
      }
      case "error": {
        taskState.error += data;
        break;
      }
      case "finish": {
        this.taskStates.delete(runId);
        clearInterval(taskState.killTimer);
        taskState.killTimer = undefined;
        data.input = taskState.input;
        taskState.callback?.call(null, {
          status: data.status,
          exitCode: data.exitCode,
          execTime: data.execTime,
          input: taskState.input,
          output: taskState.output,
          error: taskState.error,
        });
        break;
      }
    }
  }

  run(sourceCode: string, input: string) {
    const runId = this.runId++;
    return new Promise(resolve => {
      this.worker.postMessage({
        type: "run",
        data: {
          runId,
          sourceCode,
          input,
        },
      });
      this.taskStates.set(runId, new TaskState(sourceCode, input, resolve));
    });
  }
}

class TaskState {
  sourceCode: string;
  input: string;
  output: string;
  error: string;
  callback: Function | null;
  killTimer: number | undefined;

  constructor(sourceCode: string, input: string, callback: Function) {
    this.sourceCode = sourceCode;
    this.input = input;
    this.callback = callback;
    this.killTimer = undefined;
    this.output = "";
    this.error = "";
  }
}

let _pyodideWorker: Promise<any> = Promise.reject("Pyodide is not yet loaded");
pSite.then(site => {
  function loadHook() {
    _pyodideWorker.catch(() => {
      if (config.get<{ [key: string]: string }>("langSelection", {})[site.language.value] === "Python3 Pyodide") {
        _pyodideWorker = Promise.resolve(new PyodideWorker());
      }
    });
  }
  site.language.addListener(loadHook);
  events.on("envchange", loadHook);
});

const pyodideRunner = new CustomRunner(
  "Pyodide",
  (sourceCode: string, input: string, options: Options = {}): Promise<Result> => _pyodideWorker.then(pyodideWorker => pyodideWorker.run(sourceCode, input))
);

export default pyodideRunner;
