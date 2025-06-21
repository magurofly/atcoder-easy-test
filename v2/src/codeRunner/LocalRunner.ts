import {buildParams} from "../util";
import Result from "./Result";
import Options from "./Options";
import CodeRunner from "./CodeRunner";
import config from "../config";

const pattern = /^https?:\/\//;

interface LocalRunnerCompilerInfo {
  language: string;
  compilerName: string;
  label: string;
}

interface LocalRunnerRunResponse {
  status: "success" | "compileError" | "internalError";
  exitCode?: number;
  time?: number; /* [ms] */
  memory?: number; /* [KiB] */
  stdout?: string;
  stderr?: string;
}

let runners = {};
const currentLocalRunners = [];

export default class LocalRunner extends CodeRunner {
  compilerName: string;

  static setRunners(_runners: { [runnerId: string]: CodeRunner }) {
    runners = _runners;
  }

  static async update() {
    const apiURL = config.getString("codeRunner.localRunnerURL", "");
    if (!pattern.test(apiURL)) {
      throw "LocalRunner: invalid localRunnerURL";
    }

    for (const key of currentLocalRunners) {
      delete runners[key];
    }
    currentLocalRunners.length = 0;

    const res = await fetch(apiURL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "list",
      }),
    }).then(r => r.json()) as LocalRunnerCompilerInfo[];

    for (const { language, compilerName, label } of res) {
      const key = `${language} ${compilerName} ${label}`;
      runners[key] = new LocalRunner(compilerName, label);
      currentLocalRunners.push(key);
    }
  }
  
  constructor(compilerName: string, label: string) {
    super(label, "Local");
    this.compilerName = compilerName;
  }
  
  async run(sourceCode: string, input: string, options: Options = {}): Promise<Result> {
    const apiURL = config.getString("codeRunner.localRunnerURL", "");
    if (!pattern.test(apiURL)) {
      throw "LocalRunner: invalid localRunnerURL";
    }

    let res: LocalRunnerRunResponse;
    try {
      res = await fetch(apiURL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "run",
          compilerName: this.compilerName,
          sourceCode,
          stdin: input,
        }),
      }).then(r => r.json());
    } catch (error) {
      return {
        status: "IE",
        input,
        error: String(error),
      };
    }

    const result: Result = {
      status: "OK",
      exitCode: String(res.exitCode),
      execTime: +res.time,
      memory: +res.memory,
      input,
      output: res.stdout ?? "",
      error: res.stderr ?? "",
    };

    switch (res.status) {
      case "success": {
        if (res.exitCode == 0) {
          result.status = "OK";
        } else {
          result.status = "RE";
        }
        break;
      }
      case "compileError": {
        result.status = "CE";
        break;
      }
      case "internalError":
      default: {
        result.status = "IE";
      }
    }

    return result;
  }
}