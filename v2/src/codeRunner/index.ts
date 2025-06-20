import codeSaver from "../codeSaver";
import { similarLangs } from "../lang";

import Result from "./Result";
import Options from "./Options";
import CodeRunner from "./CodeRunner";
import CustomRunner from "./CustomRunner";
import AtCoderRunner from "./AtCoderRunner";
import PaizaIORunner from "./PaizaIORunner";
import WandboxRunner from "./WandboxRunner";
import WandboxCppRunner from "./WandboxCppRunner";
import pyodideRunner from "./pyodideRunner";
import pSite from "../site";
import config from "../config";
import { fetchWandboxCompilers, toRunner } from "../wandbox-api";
import LocalRunner from "./LocalRunner";

// runners[key] = runner; key = language + " " + environmentInfo
const runners: { [runnerId: string]: CodeRunner } = {
  "C C17 Clang paiza.io": new PaizaIORunner("c", "C (C17 / Clang)"),
  "Python3 CPython paiza.io": new PaizaIORunner("python3", "Python3"),
  "Python3 Pyodide": pyodideRunner,
  "Bash paiza.io": new PaizaIORunner("bash", "Bash"),
  "Clojure paiza.io": new PaizaIORunner("clojure", "Clojure"),
  "D LDC paiza.io": new PaizaIORunner("d", "D (LDC)"),
  "Erlang paiza.io": new PaizaIORunner("erlang", "Erlang"),
  "Elixir paiza.io": new PaizaIORunner("elixir", "Elixir"),
  "F# Interactive paiza.io": new PaizaIORunner("fsharp", "F# (Interactive)"),
  "Haskell paiza.io": new PaizaIORunner("haskell", "Haskell"),
  "JavaScript paiza.io": new PaizaIORunner("javascript", "JavaScript"),
  "Kotlin paiza.io": new PaizaIORunner("kotlin", "Kotlin"),
  "Objective-C paiza.io": new PaizaIORunner("objective-c", "Objective-C"),
  "Perl paiza.io": new PaizaIORunner("perl", "Perl"),
  "PHP paiza.io": new PaizaIORunner("php", "PHP"),
  "Ruby paiza.io": new PaizaIORunner("ruby", "Ruby"),
  "Rust 1.42.0 AtCoder": new AtCoderRunner("4050", "Rust (1.42.0)"),
  "Rust paiza.io": new PaizaIORunner("rust", "Rust"),
  "Scala paiza": new PaizaIORunner("scala", "Scala"),
  "Scheme paiza.io": new PaizaIORunner("scheme", "Scheme"),
  "Swift paiza.io": new PaizaIORunner("swift", "Swift"),
  "Text local": new CustomRunner("Text",
    async (sourceCode: string, input: string) => {
      return {
        status: "OK",
        exitCode: "0",
        input,
        output: sourceCode,
      };
    }
  ),
  "Basic Visual Basic paiza.io": new PaizaIORunner("vb", "Visual Basic"),
  "COBOL Free paiza.io": new PaizaIORunner("cobol", "COBOL - Free"),
  "COBOL Fixed OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4060", "COBOL - Fixed (OpenCOBOL 1.1.0)"),
  "COBOL Free OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4061", "COBOL - Free (OpenCOBOL 1.1.0)"),
};

// wandboxの環境を追加
const wandboxPromise = fetchWandboxCompilers().then((compilers) => {
  for (const compiler of compilers) {
    let language = compiler.language;
    if (compiler.language === "Python" && /python-3\./.test(compiler.version)) {
      language = "Python3";
    }
    const key = language + " " + compiler.name;
    runners[key] = toRunner(compiler);
    console.log("wandbox", key, runners[key]);
  }
});

pSite.then(site => {
  if (site.name == "AtCoder") {
    // AtCoderRunner がない場合は、追加する
    for (const [languageId, descriptor] of Object.entries(site.langMap)) {
      const m = (descriptor as string).match(/([^ ]+)(.*)/);
      if (m) {
        const name = `${m[1]} ${m[2].slice(1)} AtCoder`;
        runners[name] = new AtCoderRunner(languageId, descriptor as string);
      }
    }
  }
});

// LocalRunner 関連
config.registerText("codeRunner.localRunnerURL", "", "URL of Local Runner API (cf. https://github.com/magurofly/atcoder-easy-test/blob/main/v2/docs/LocalRunner.md)"); //TODO: add cf.
LocalRunner.setRunners(runners);
LocalRunner.update();

console.info("AtCoder Easy Test: codeRunner OK");

config.registerCount("codeRunner.maxRetry", 3, "Max count of retry when IE (Internal Error)");

export default {
  // 指定した環境でコードを実行する
  async run(runnerId: string, sourceCode: string, input: string, expectedOutput: string | null, options: Options = { trim: true, split: true }): Promise<Result> {
    // CodeRunner が存在しない言語ID
    if (!(runnerId in runners)) return Promise.reject("Language not supported");

    // 最後に実行したコードを保存
    if (sourceCode.length > 0) pSite.then(site => codeSaver.save(site.taskURI, sourceCode));

    // 実行
    const maxRetry = config.get("codeRunner.maxRetry", 3);
    for (let retry = 0; retry < maxRetry; retry++) {
      try {
        const result = await runners[runnerId].test(sourceCode, input, expectedOutput, options);
        const lang = runnerId.split(" ")[0];
        if (result.status == "IE") {
          console.error(result);
          const runnerIds = Object.keys(runners).filter(runnerId => runnerId.split(" ")[0] == lang);
          const index = runnerIds.indexOf(runnerId);
          runnerId = runnerIds[(index + 1) % runnerIds.length];
          continue;
        }
        return result;
      } catch (e) {
        console.error(e);
      }
    }
  },

  // 環境の名前の一覧を取得する
  // @return runnerIdとラベルのペアの配列
  async getEnvironment(languageId: string): Promise<[string, string][]> {
    await wandboxPromise; // wandboxAPI がコンパイラ情報を取ってくるのを待つ
    const langs = similarLangs(languageId, Object.keys(runners));
    if (langs.length == 0) throw `Undefined language: ${languageId}`;
    return langs.map(runnerId => [runnerId, runners[runnerId].label]);
  },
};