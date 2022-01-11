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
  "C GCC 10.2.0 Wandbox": new WandboxRunner("gcc-10.2.0-c", "C (GCC 10.2.0)"),
  "C C17 Clang 10.0.0 paiza.io": new PaizaIORunner("c", "C (C17 / Clang 10.0.0)"),
  "C++ GCC 10.2.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-10.2.0", "C++ (GCC 10.2.0) + ACL", { options: "warning,boost-1.73.0-gcc-9.2.0,gnu++17" }),
  "C++ Clang 10.0.1 + ACL Wandbox": new WandboxCppRunner("clang-10.0.1", "C++ (Clang 10.0.1) + ACL", { options: "warning,boost-nothing-clang-10.0.0,c++17" }),
  "Python3 CPython 3.8.2 paiza.io": new PaizaIORunner("python3", "Python (3.8.2)"),
  "Python3 Brython": brythonRunner,
  "Python3 Pyodide": pyodideRunner,
  "Bash 5.0.17 paiza.io": new PaizaIORunner("bash", "Bash (5.0.17)"),
  "Bash 5.0.17 Wandbox": new WandboxRunner("bash", "Bash (5.0.17(1)-release)"),
  "C# .NET Core 3.1.407 Wandbox": new WandboxRunner("dotnetcore-3.1.407", "C# (.NET Core 3.1.407)"),
  "C# Mono-mcs 6.12.0.122 Wandbox": new WandboxRunner("mono-6.12.0.122", "C# (Mono-mcs 6.12.0.122)"),
  "Clojure 1.10.1-1 paiza.io": new PaizaIORunner("clojure", "Clojure (1.10.1-1)"),
  "Crystal 0.36.1 Wandbox": new WandboxRunner("crystal-0.36.1", "Crystal (0.36.1)"),
  "D LDC 1.23.0 paiza.io": new PaizaIORunner("d", "D (LDC 1.23.0)"),
  "D DMD 2.093.1": new WandboxRunner("dmd-2.093.1", "D (DMD 2.093.1)"),
  "D LDC 1.23.0": new WandboxRunner("ldc-1.23.0", "D (LDC 1.23.0)"),
  "Erlang 10.6.4 paiza.io": new PaizaIORunner("erlang", "Erlang (10.6.4)"),
  "Erlang 22.3.4.16": new WandboxRunner("erlang-22.3.4.16", "Erlang (22.3.4.16)"),
  "Elixir 1.10.4": new WandboxRunner("elixir-1.10.4", "Elixir (1.10.4)"),
  "Elixir 1.10.4 paiza.io": new PaizaIORunner("elixir", "Elixir (1.10.4)"),
  "F# Interactive 4.0 paiza.io": new PaizaIORunner("fsharp", "F# (Interactive 4.0)"),
  "Go 1.14.15 Wandbox": new WandboxRunner("go-1.14.15", "Go (1.14.15)"),
  "Haskell GHC 8.8.4 Wandbox": new WandboxRunner("ghc-8.8.4", "Haskell (GHC 8.8.4)"),
  "Haskell GHC 8.6.5 paiza.io": new PaizaIORunner("haskell", "Haskell (GHC 8.6.5)"),
  "Java openjdk-jdk-15.0.3+2 Wandbox": new WandboxRunner("openjdk-jdk-15.0.3+2", "Java (JDK 15.0.3+2)"),
  "Java openjdk-jdk-14.0.2+12 Wandbox": new WandboxRunner("openjdk-jdk-14.0.2+12", "Java (JDK 14.0.2+12)"),
  "JavaScript Node.js paiza.io": new PaizaIORunner("javascript", "JavaScript (Node.js 12.18.3)"),
  "JavaScript Node.js 12.22.1 Wandbox": new WandboxRunner("nodejs-12.22.1", "JavaScript (Node.js 12.22.1)"),
  "Julia 1.6.1 Wandbox": new WandboxRunner("julia-1.6.1", "Julia (1.6.1)"),
  "Kotlin 1.4.0 paiza.io": new PaizaIORunner("kotlin", "Kotlin (1.4.0)"),
  "Lua 5.3.6 Wandbox": new WandboxRunner("lua-5.3.6", "Lua (Lua 5.3.6)"),
  "Lua LuaJIT 2.0.5 Wandbox": new WandboxRunner("luajit-2.0.5", "Lua (LuaJIT 2.0.5)"),
  "Nim 1.0.10 Wandbox": new WandboxRunner("nim-1.0.10", "Nim (1.0.10)"),
  "Objective-C Clang 10.0.0 paiza.io": new PaizaIORunner("objective-c", "Objective-C (Clang 10.0.0)"),
  "OCaml 4.10.2 Wandbox": new WandboxRunner("ocaml-4.10.2", "OCaml (4.10.2)"),
  "Pascal FPC 3.0.4 Wandbox": new WandboxRunner("fpc-3.0.4", "Pascal (FPC 3.0.4)"),
  "Perl 5.30.0 paiza.io": new PaizaIORunner("perl", "Perl (5.30.0)"),
  "Perl 5.30.3 Wandbox": new WandboxRunner("perl-5.30.3", "Perl (5.30.3)"),
  "PHP 7.4.10 paiza.io": new PaizaIORunner("php", "PHP (7.4.10)"),
  "PHP 7.4.16 Wandbox": new WandboxRunner("php-7.4.16", "PHP (7.4.16)"),
  "Python PyPy 7.3.4 Wandbox": new WandboxRunner("pypy-3.7-v7.3.4", "PyPy2 (7.3.4)"),
  "Python3 PyPy3 7.3.4 Wandbox": new WandboxRunner("pypy-2.7-v7.3.4", "PyPy3 (7.3.4)"),
  "Ruby 2.7.1 paiza.io": new PaizaIORunner("ruby", "Ruby (2.7.1)"),
  "Ruby 3.1.0 Wandbox": new WandboxRunner("ruby-3.1.0", "Ruby (3.1.0)"),
  "Ruby 2.7.3 Wandbox": new WandboxRunner("ruby-2.7.3", "Ruby (2.7.1)"),
  "Rust 1.42.0 AtCoder": new AtCoderRunner("4050", "Rust (1.42.0)"),
  "Rust 1.50.0 Wandbox": new WandboxRunner("rust-1.50.0", "Rust (1.50.0)"),
  "Rust 1.43.0 paiza.io": new PaizaIORunner("rust", "Rust (1.43.0)"),
  "Scala 2.13.3 paiza": new PaizaIORunner("scala", "Scala (2.13.3)"),
  "Scala 2.13.5 Wandbox": new WandboxRunner("scala-2.13.5", "Scala (2.13.5)"),
  "Scheme Gauche 0.9.6 paiza.io": new PaizaIORunner("scheme", "Scheme (Gauche 0.9.6)"),
  "Swift 5.2.5 paiza.io": new PaizaIORunner("swift", "Swift (5.2.5)"),
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
  "Basic Visual Basic .NET Core 4.0.1 paiza.io": new PaizaIORunner("vb", "Visual Basic (.NET Core 4.0.1)"),
  "COBOL Free OpenCOBOL 2.2.0 paiza.io": new PaizaIORunner("cobol", "COBOL - Free (OpenCOBOL 2.2.0)"),
  "COBOL Fixed OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4060", "COBOL - Fixed (OpenCOBOL 1.1.0)"),
  "COBOL Free OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4061", "COBOL - Free (OpenCOBOL 1.1.0)"),
  "C++ GCC 9.3.0 + ACL Wandbox": new WandboxCppRunner("gcc-9.3.0", "C++ (GCC 9.3.0) + ACL"),
};

pSite.then(site => {
  if (site.name == "AtCoder") {
    // AtCoderRunner がない場合は、追加する
    for (const e of document.querySelectorAll("#select-lang option[value]")) {
      const m = e.textContent.match(/([^ ]+) \(([^)]+)\)/);
      if (m) {
        const name = `${m[1]} ${m[2]} AtCoder`;
        const languageId = (e as HTMLOptionElement).value;
        runners[name] = new AtCoderRunner(languageId, e.textContent);
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
    if (sourceCode.length > 0) codeSaver.save(sourceCode);

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