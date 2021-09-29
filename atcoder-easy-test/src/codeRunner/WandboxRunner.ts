import Result from "./Result";
import CodeRunner from "./CodeRunner";
import Options from "./Options";

interface WandboxRequest {
  compiler: string,
  code: string,
  stdin?: string,
  codes?: Array<string>,
  "compiler-option-raw"?: string,
}

export default class WandboxRunner extends CodeRunner {
  name: string;
  options: { [key: string]: string } | ((sourceCode: string, input: string) => { [key: string]: string });

  constructor(name: string, label: string, options = {}) {
    super(label, "Wandbox");
    this.name = name;
    this.options = options;
  }

  getOptions(sourceCode: string, input: string): { [key: string]: string } {
    if (typeof this.options == "function") return this.options(sourceCode, input);
    return this.options;
  }

  run(sourceCode: string, input: string): Promise<Result> {
    const options = this.getOptions(sourceCode, input);
    return this.request(Object.assign({
      compiler: this.name,
      code: sourceCode,
      stdin: input,
    }, options));
  }

  async request(body: WandboxRequest): Promise<Result> {
    const startTime = Date.now();
    let res;
    try {
      res = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).then(r => r.json());
    } catch (error) {
      console.error(error);
      return {
        status: "IE",
        input: body.stdin,
        error: String(error),
      };
    }
    const endTime = Date.now();

    const result: Result = {
      status: "OK",
      exitCode: String(res.status),
      execTime: endTime - startTime,
      input: body.stdin,
      output: String(res.program_output || ""),
      error: String(res.program_error || ""),
    };

    // 正常終了以外の場合
    if (res.status != 0) {
      if (res.signal) {
        result.exitCode += ` (${res.signal})`;
      }
      result.output = String(res.compiler_output || "") + String(result.output || "");
      result.error = String(res.compiler_error || "") + String(result.error || "");
      if (res.compiler_output || res.compiler_error) {
        result.status = "CE";
      } else {
        result.status = "RE";
      }
    }

    return result;
  }
}