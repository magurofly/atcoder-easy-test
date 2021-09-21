import { buildParams, sleep } from "./util";
import Result from "./Result";
import CodeRunner from "./CodeRunner";

let waitAtCoderCustomTest: Promise<any> = Promise.resolve();
const AtCoderCustomTestBase = location.href.replace(/\/tasks\/.+$/, "/custom_test");
const AtCoderCustomTestResultAPI = AtCoderCustomTestBase + "/json?reload=true";
const AtCoderCustomTestSubmitAPI = AtCoderCustomTestBase + "/submit/json";


export default class AtCoderRunner extends CodeRunner {
  languageId: string;

  constructor(languageId: string, label: string) {
    super(label, "AtCoder");
    this.languageId = languageId;
  }
  
  async run(sourceCode: string, input: string): Promise<Result> {
    const promise = this.submit(sourceCode, input);
    waitAtCoderCustomTest = promise;
    return await promise;
  }
  
  async submit(sourceCode: string, input: string): Promise<Result> {
    try {
      await waitAtCoderCustomTest;
    } catch (error) {
      console.error(error);
    }
    
    const error = await fetch(AtCoderCustomTestSubmitAPI, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: buildParams({
        "data.LanguageId": String(this.languageId),
        sourceCode,
        input,
        csrf_token: unsafeWindow.csrfToken,
      }),
    }).then(r => r.text());
    
    if (error) {
      throw new Error(error)
    }
    
    await sleep(100);
    
    for (;;) {
      const data = await fetch(AtCoderCustomTestResultAPI, {
        method: "GET",
        credentials: "include",
      }).then(r => r.json());
      
      if (!("Result" in data)) continue;
      const result = data.Result;
      
      if ("Interval" in data) {
        await sleep(data.Interval);
        continue;
      }
      
      return {
        status: (result.ExitCode == 0) ? "OK" : (result.TimeConsumption == -1) ? "CE" : "RE",
        exitCode: result.ExitCode,
        execTime: result.TimeConsumption,
        memory: result.MemoryConsumption,
        stdout: data.Stdout,
        stderr: data.Stderr,
      };
    }
  }
}