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
import brythonRunner from "./brythonRunner";
import pyodideRunner from "./pyodideRunner";
import pSite from "../site";
import config from "../config";
import { fetchWandboxCompilers, toRunner } from "../wandbox-api";

const runners: { [runnerId: string]: CodeRunner } = {
  "C C17 Clang paiza.io": new PaizaIORunner("c", "C (C17 / Clang)"),
  "C++ GCC 13.2.0 + Boost 1.83.0 + ACL Wandbox": new WandboxCppRunner("gcc-13.2.0", "C++ (GCC 13.2.0) + ACL", { "compiler-option-raw": "-march=native\n-std=gnu++2a\n-Wall\n-Wextra\n-O2\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.83.0-gcc-13.2.0/include\n-I." }),
  "C++ GCC 10.2.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-10.2.0", "C++ (GCC 10.2.0) + ACL", { "compiler-option-raw": "-march=native\n-std=gnu++17\n-Wall\n-Wextra\n-O2\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.75.0-gcc-10.2.0/include\n-I." }),
  "C++ GCC 9.3.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-9.3.0", "C++ (GCC 9.3.0) + ACL", { "compiler-option-raw": "-march=native\n-std=gnu++17\n-Wall\n-Wextra\n-O2\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.75.0-gcc-9.3.0/include\n-I." }),
  "C++ Clang 10.0.1 + ACL Wandbox": new WandboxCppRunner("clang-10.0.1", "C++ (Clang 10.0.1) + ACL", { "compiler-option-raw": "-march=native\n-std=c++17\n-stdlib=libc++\n-Wall\n-O2\n-DNDEBUG\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.75.0-clang-10.0.1/include\n-I." }),
  "Python3 CPython paiza.io": new PaizaIORunner("python3", "Python3"),
  "Python3 Brython": brythonRunner,
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
fetchWandboxCompilers().then((compilers) => {
  compilers.map(toRunner).forEach((runner) => {
    runners[runner.label] = runner;
  });
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
    const langs = similarLangs(languageId, Object.keys(runners));
    if (langs.length == 0) throw `Undefined language: ${languageId}`;
    return langs.map(runnerId => [runnerId, runners[runnerId].label]);
  },
};