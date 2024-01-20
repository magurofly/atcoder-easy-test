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

const runners: { [runnerId: string]: CodeRunner } = {
  "C GCC 9.3.0 Wandbox": new WandboxRunner("gcc-9.3.0-c", "C (GCC 9.3.0)", { "compiler-option-raw": "-march=native\n-std=gnu11\n-O2\n-DONLINE_JUDGE\n-lm" }),
  "C C17 Clang paiza.io": new PaizaIORunner("c", "C (C17 / Clang)"),
  "C++ GCC 10.2.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-10.5.0", "C++ (GCC 10.5.0) + ACL", { "compiler-option-raw": "-march=native\n-std=gnu++17\n-Wall\n-Wextra\n-O2\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.75.0-gcc-10.5.0/include\n-I." }),
  "C++ GCC 9.3.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-9.3.0", "C++ (GCC 9.3.0) + ACL", { "compiler-option-raw": "-march=native\n-std=gnu++17\n-Wall\n-Wextra\n-O2\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.75.0-gcc-9.3.0/include\n-I." }),
  "C++ Clang 10.0.1 + ACL Wandbox": new WandboxCppRunner("clang-10.0.1", "C++ (Clang 10.0.1) + ACL", { "compiler-option-raw": "-march=native\n-std=c++17\n-stdlib=libc++\n-Wall\n-O2\n-DNDEBUG\n-DONLINE_JUDGE\n-I/opt/wandbox/boost-1.75.0-clang-10.0.1/include\n-I." }),
  "Python3 CPython paiza.io": new PaizaIORunner("python3", "Python3"),
  "Python3 Brython": brythonRunner,
  "Python3 Pyodide": pyodideRunner,
  "Bash paiza.io": new PaizaIORunner("bash", "Bash"),
  "Bash 5.0.17 Wandbox": new WandboxRunner("bash", "Bash (5.0.17(1)-release)"),
  "C# .NET Core 3.1.407 Wandbox": new WandboxRunner("dotnetcore-3.1.407", "C# (.NET Core 3.1.407)"),
  "C# Mono-mcs 6.12.0.122 Wandbox": new WandboxRunner("mono-6.12.0.122", "C# (Mono-mcs 6.12.0.122)"),
  "Clojure paiza.io": new PaizaIORunner("clojure", "Clojure"),
  "Crystal 0.36.1 Wandbox": new WandboxRunner("crystal-0.36.1", "Crystal (0.36.1)"),
  "D LDC paiza.io": new PaizaIORunner("d", "D (LDC)"),
  "D DMD 2.093.1": new WandboxRunner("dmd-2.093.1", "D (DMD 2.093.1)"),
  "D LDC 1.23.0": new WandboxRunner("ldc-1.23.0", "D (LDC 1.23.0)"),
  "Erlang paiza.io": new PaizaIORunner("erlang", "Erlang"),
  "Erlang 22.3.4.16": new WandboxRunner("erlang-22.3.4.16", "Erlang (22.3.4.16)"),
  "Elixir 1.10.4": new WandboxRunner("elixir-1.10.4", "Elixir (1.10.4)"),
  "Elixir paiza.io": new PaizaIORunner("elixir", "Elixir"),
  "F# Interactive paiza.io": new PaizaIORunner("fsharp", "F# (Interactive)"),
  "Go 1.14.15 Wandbox": new WandboxRunner("go-1.14.15", "Go (1.14.15)"),
  "Haskell GHC 8.8.4 Wandbox": new WandboxRunner("ghc-8.8.4", "Haskell (GHC 8.8.4)"),
  "Haskell paiza.io": new PaizaIORunner("haskell", "Haskell"),
  "Java openjdk-jdk-15.0.3+2 Wandbox": new WandboxRunner("openjdk-jdk-15.0.3+2", "Java (JDK 15.0.3+2)"),
  "Java openjdk-jdk-14.0.2+12 Wandbox": new WandboxRunner("openjdk-jdk-14.0.2+12", "Java (JDK 14.0.2+12)"),
  "JavaScript paiza.io": new PaizaIORunner("javascript", "JavaScript"),
  "JavaScript Node.js 12.22.1 Wandbox": new WandboxRunner("nodejs-12.22.1", "JavaScript (Node.js 12.22.1)"),
  "Julia 1.6.1 Wandbox": new WandboxRunner("julia-1.6.1", "Julia (1.6.1)"),
  "Kotlin paiza.io": new PaizaIORunner("kotlin", "Kotlin"),
  "Lua 5.3.6 Wandbox": new WandboxRunner("lua-5.3.6", "Lua (Lua 5.3.6)"),
  "Lua LuaJIT 2.0.5 Wandbox": new WandboxRunner("luajit-2.0.5", "Lua (LuaJIT 2.0.5)"),
  "Nim 1.0.10 Wandbox": new WandboxRunner("nim-1.0.10", "Nim (1.0.10)"),
  "Objective-C paiza.io": new PaizaIORunner("objective-c", "Objective-C"),
  "OCaml 4.10.2 Wandbox": new WandboxRunner("ocaml-4.10.2", "OCaml (4.10.2)"),
  "Pascal FPC 3.0.4 Wandbox": new WandboxRunner("fpc-3.0.4", "Pascal (FPC 3.0.4)"),
  "Perl paiza.io": new PaizaIORunner("perl", "Perl"),
  "Perl 5.30.3 Wandbox": new WandboxRunner("perl-5.30.3", "Perl (5.30.3)"),
  "PHP paiza.io": new PaizaIORunner("php", "PHP"),
  "PHP 7.4.16 Wandbox": new WandboxRunner("php-7.4.16", "PHP (7.4.16)"),
  "Python PyPy 7.3.4 Wandbox": new WandboxRunner("pypy-2.7-v7.3.4", "PyPy2 (7.3.4)"),
  "Python3 PyPy3 7.3.4 Wandbox": new WandboxRunner("pypy-3.7-v7.3.4", "PyPy3 (7.3.4)"),
  "Ruby paiza.io": new PaizaIORunner("ruby", "Ruby"),
  "Ruby 3.2.2 Wandbox": new WandboxRunner("ruby-3.2.2", "Ruby (3.2.2)"),
  "Ruby 3.1.4 Wandbox": new WandboxRunner("ruby-3.1.4", "Ruby (3.1.4)"),
  "Ruby 3.0.6 Wandbox": new WandboxRunner("ruby-3.0.6", "Ruby (3.0.6)"),
  "Ruby 2.7.8 Wandbox": new WandboxRunner("ruby-2.7.8", "Ruby (2.7.8)"),
  "Rust 1.42.0 AtCoder": new AtCoderRunner("4050", "Rust (1.42.0)"),
  "Rust 1.50.0 Wandbox": new WandboxRunner("rust-1.50.0", "Rust (1.50.0)"),
  "Rust paiza.io": new PaizaIORunner("rust", "Rust"),
  "Scala paiza": new PaizaIORunner("scala", "Scala"),
  "Scala 2.13.5 Wandbox": new WandboxRunner("scala-2.13.5", "Scala (2.13.5)"),
  "Scheme paiza.io": new PaizaIORunner("scheme", "Scheme"),
  "Swift paiza.io": new PaizaIORunner("swift", "Swift"),
  "Swift 5.3.3 Wandbox": new WandboxRunner("swift-5.3.3", "Swift (5.3.3)"),
  "TypeScript typescript-3.9.9 nodejs 14.16.1 Wandbox": new WandboxRunner("typescript-3.9.9 nodejs 14.16.1", "TypeScript (3.9.9)"),
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