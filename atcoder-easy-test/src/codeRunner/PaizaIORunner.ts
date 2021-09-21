import {buildParams} from "./util";
import Result from "./Result";
import CodeRunner from "./CodeRunner";

export default class PaizaIORunner extends CodeRunner {
  name: string;
  
  constructor(name: string, label: string) {
    super(label, "PaizaIO");
    this.name = name;
  }
  
  async run(sourceCode: string, input: string): Promise<Result> {
    let id: string, status: string, error: string;
    try {
      const res = await fetch("https://api.paiza.io/runners/create?" + buildParams({
        source_code: sourceCode,
        language: this.name,
        input,
        longpoll: "true",
        longpoll_timeout: "10",
        api_key: "guest",
      }), {
        method: "POST",
        mode: "cors",
      }).then(r => r.json());
      id = res.id;
      status = res.status;
      error = res.error;
    } catch (error) {
      return {
        status: "IE",
        stderr: error,
      };
    }
    
    while (status == "running") {
      const res = await fetch("https://api.paiza.io/runners/get_status?" + buildParams({
        id,
        api_key: "guest",
      }), {
        mode: "cors",
      }).then(res => res.json());
      status = res.status;
      error = res.error;
    }

    const res = await fetch("https://api.paiza.io/runners/get_details?" + buildParams({
      id,
      api_key: "guest",
    }), {
      mode: "cors",
    }).then(r => r.json());

    const result: Result = {
      status: "OK",
      exitCode: String(res.exit_code),
      execTime: +res.time * 1e3,
      memory: +res.memory * 1e-3,
    };

    if (res.build_result == "failure") {
      result.status = "CE";
      result.exitCode = res.build_exit_code;
      result.stdout = res.build_stdout;
      result.stderr = res.build_stderr;
    } else {
      result.status = (res.result == "timeout") ? "TLE" : (res.result == "failure") ? "RE" : "OK";
      result.exitCode = res.exit_code;
      result.stdout = res.stdout;
      result.stderr = res.stderr;
    }

    return result;
  }
}