import { buildParams, sleep } from "../util";
import Result from "./Result";
import Options from "./Options";
import CodeRunner from "./CodeRunner";

let waitAtCoderCustomTest: Promise<any> = Promise.resolve();
const AtCoderCustomTestBase = location.href.replace(/\/tasks\/.+$/, "/custom_test");
const AtCoderCustomTestResultAPI = AtCoderCustomTestBase + "/json?reload=true";
const AtCoderCustomTestSubmitAPI = AtCoderCustomTestBase + "/submit/json";
const ce_groups = new Set();

export default class AtCoderRunner extends CodeRunner {
  languageId: string;

  constructor(languageId: string, label: string) {
    super(label, "AtCoder");
    this.languageId = languageId;
  }
  
  async run(sourceCode: string, input: string, options: Options = {}): Promise<Result> {
    const promise = this.submit(sourceCode, input, options);
    waitAtCoderCustomTest = promise;
    return await promise;
  }
  
  async submit(sourceCode: string, input: string, options: Options = {}): Promise<Result> {
    try {
      await waitAtCoderCustomTest;
    } catch (error) {
      console.error(error);
    }

    // 同じグループで CE なら実行を省略し CE を返す
    if ("runGroupId" in options && ce_groups.has(options.runGroupId)) {
      return {
        status: "CE",
        input,
      };
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

      const status = (result.ExitCode == 0) ? "OK" : (result.TimeConsumption == -1) ? "CE" : "RE";
      if (status == "CE" && "runGroupId" in options) {
        ce_groups.add(options.runGroupId);
      }
      
      return {
        status,
        exitCode: result.ExitCode,
        execTime: result.TimeConsumption,
        memory: result.MemoryConsumption,
        input,
        output: data.Stdout,
        error: data.Stderr,
      };
    }
  }
}