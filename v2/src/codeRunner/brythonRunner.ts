import CustomRunner from "./CustomRunner";

let brythonRunnerLoaded = false;
const brythonRunner = new CustomRunner("Brython", async (sourceCode, input, options = {}) => {
  if (!brythonRunnerLoaded) {
    // BrythonRunner を読み込む
    await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/pythonpad/brython-runner/lib/brython-runner.bundle.js";
      script.onload = () => {
        brythonRunnerLoaded = true;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }
  
  let stdout = "";
  let stderr = "";
  let stdinOffset = 0;
  const BrythonRunner = (unsafeWindow as unknown as { BrythonRunner: any }).BrythonRunner;
  const runner = new BrythonRunner({
    stdout: { write(content) { stdout += content; }, flush() {} },
    stderr: { write(content) { stderr += content; }, flush() {} },
    stdin: { async readline() {
      let index = input.indexOf("\n", stdinOffset) + 1;
      if (index == 0) index = input.length;
      const text = input.slice(stdinOffset, index);
      stdinOffset = index;
      return text;
    } },
  });
  
  const timeStart = Date.now();
  await runner.runCode(sourceCode);
  const timeEnd = Date.now();
  
  return {
    status: "OK",
    exitCode: "0",
    execTime: (timeEnd - timeStart),
    input,
    output: stdout,
    error: stderr,
  };
});

export default brythonRunner;