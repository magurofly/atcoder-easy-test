import Result from "./Result";
import CustomRunner from "./CustomRunner";

async function loadPyodide(): Promise<any> {
  const script = await fetch("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js").then(res => res.text());
  unsafeWindow["Function"](script)();
  const pyodide = await unsafeWindow["loadPyodide"]({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
  });
  await pyodide.runPythonAsync(`
import contextlib, io, platform
class __redirect_stdin(contextlib._RedirectStream):
  _stream = "stdin"
`);
  return pyodide;
}

let _pyodide: Promise<any> = Promise.reject();
let _serial = Promise.resolve();
const pyodideRunner = new CustomRunner("Pyodide", (sourceCode: string, input: string): Promise<Result> => new Promise((resolve, reject) => {
  _serial = _serial.finally(async () => {
    
    const pyodide = await (_pyodide = _pyodide.catch(loadPyodide));

    const code = `
def __run():
 global __stdout, __stderr, __stdin, __code
 with __redirect_stdin(io.StringIO(__stdin)):
  with contextlib.redirect_stdout(io.StringIO()) as __stdout:
   with contextlib.redirect_stderr(io.StringIO()) as __stderr:
    try:
     pass
` + sourceCode.split("\n").map(line => "     " + line).join("\n") + `
    except SystemExit as e:
     __code = e.code
`;

    let status: "OK" | "RE" = "OK";
    let exitCode: string = "0";
    let stdout: string = "";
    let stderr: string = "";
    let startTime: number = -Infinity;
    let endTime: number = Infinity;
    pyodide.globals.__stdin = input;

    try {
      pyodide.globals.__code = null;
      await pyodide.loadPackagesFromImports(code);
      await pyodide.runPythonAsync(code);
      startTime = Date.now();
      pyodide.runPython("__run()");
      endTime = Date.now();
      stdout += pyodide.globals.__stdout.getvalue();
      stderr += pyodide.globals.__stderr.getvalue();
      if (typeof pyodide.globals.__code == "number") {
        exitCode = String(pyodide.globals.__code);
        if (pyodide.globals.__code != 0) status = "RE";
      }
    } catch (error) {
      status = "RE";
      exitCode = "-1";
      stderr += error.toString();
    }
    
    resolve({
      status,
      exitCode,
      execTime: (endTime - startTime),
      input,
      output: stdout,
      error: stderr,
    });

  });
}));

export default pyodideRunner;