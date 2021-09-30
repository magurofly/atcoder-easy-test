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
import site from "../site";

const runners = {
  "C GCC 10.1.0 Wandbox": new WandboxRunner("gcc-10.1.0-c", "C (GCC 10.1.0)"),
  "C C17 Clang 10.0.0 paiza.io": new PaizaIORunner("c", "C (C17 / Clang 10.0.0)"),
  "C++ GCC 10.1.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-10.1.0", "C++ (GCC 10.1.0) + ACL", {options: "warning,boost-1.73.0-gcc-9.2.0,gnu++17"}),
  "C++ Clang 10.0.0 + ACL Wandbox": new WandboxCppRunner("clang-10.0.0", "C++ (Clang 10.0.0) + ACL", {options: "warning,boost-nothing-clang-10.0.0,c++17"}),
  "Python3 CPython 3.8.2 paiza.io": new PaizaIORunner("python3", "Python (3.8.2)"),
  "Python3 Brython": brythonRunner,
  "Bash 5.0.17 paiza.io": new PaizaIORunner("bash", "Bash (5.0.17)"),
  "C# .NET Core 6.0.100-alpha.1.20562.2 Wandbox": new WandboxRunner("csharp", "C# (.NET Core 6.0.100-alpha.1.20562.2)"),
  "C# Mono-mcs HEAD Wandbox": new WandboxRunner("mono-head", "C# (Mono-mcs HEAD)"),
  "Clojure 1.10.1-1 paiza.io": new PaizaIORunner("clojure", "Clojure (1.10.1-1)"),
  "D LDC 1.23.0 paiza.io": new PaizaIORunner("d", "D (LDC 1.23.0)"),
  "Erlang 10.6.4 paiza.io": new PaizaIORunner("erlang", "Erlang (10.6.4)"),
  "Elixir 1.10.4 paiza.io": new PaizaIORunner("elixir", "Elixir (1.10.4)"),
  "F# Interactive 4.0 paiza.io": new PaizaIORunner("fsharp", "F# (Interactive 4.0)"),
  "Go 1.14.1 Wandbox": new WandboxRunner("go-1.14.1", "Go (1.14.1)"),
  "Haskell GHC HEAD Wandbox": new WandboxRunner("ghc-head", "Haskell (GHC HEAD)"),
  "JavaScript Node.js paiza.io": new PaizaIORunner("javascript", "JavaScript (Node.js 12.18.3)"),
  "Kotlin 1.4.0 paiza.io": new PaizaIORunner("kotlin", "Kotlin (1.4.0)"),
  "Lua 5.3.4 Wandbox": new WandboxRunner("lua-5.3.4", "Lua (Lua 5.3.4)"),
  "Lua LuaJIT HEAD Wandbox": new WandboxRunner("luajit-head", "Lua (LuaJIT HEAD)"),
  "Nim 1.0.6 Wandbox": new WandboxRunner("nim-1.0.6", "Nim (1.0.6)"),
  "Objective-C Clang 10.0.0 paiza.io": new PaizaIORunner("objective-c", "Objective-C (Clang 10.0.0)"),
  "Ocaml HEAD Wandbox": new WandboxRunner("ocaml-head", "OCaml (HEAD)"),
  "Pascal FPC 3.0.2 Wandbox": new WandboxRunner("fpc-3.0.2", "Pascal (FPC 3.0.2)"),
  "Perl 5.30.0 paiza.io": new PaizaIORunner("perl", "Perl (5.30.0)"),
  "PHP 7.4.10 paiza.io": new PaizaIORunner("php", "PHP (7.4.10)"),
  "PHP 7.3.3 Wandbox": new WandboxRunner("php-7.3.3", "PHP (7.3.3)"),
  "Python PyPy HEAD Wandbox": new WandboxRunner("pypy-head", "PyPy2 (HEAD)"),
  "Python3 PyPy3 7.2.0 Wandbox": new WandboxRunner("pypy-7.2.0-3", "PyPy3 (7.2.0)"),
  "Ruby 2.7.1 paiza.io": new PaizaIORunner("ruby", "Ruby (2.7.1)"),
  "Ruby HEAD Wandbox": new WandboxRunner("ruby-head", "Ruby (HEAD)"),
  "Ruby 2.7.1 Wandbox": new WandboxRunner("ruby-2.7.1", "Ruby (2.7.1)"),
  "Rust 1.42.0 AtCoder": new AtCoderRunner("4050", "Rust (1.42.0)"),
  "Rust HEAD Wandbox": new WandboxRunner("rust-head", "Rust (HEAD)"),
  "Rust 1.43.0 paiza.io": new PaizaIORunner("rust", "Rust (1.43.0)"),
  "Scala 2.13.3 paiza": new PaizaIORunner("scala", "Scala (2.13.3)"),
  "Scheme Gauche 0.9.6 paiza.io": new PaizaIORunner("scheme", "Scheme (Gauche 0.9.6)"),
  "Swift 5.2.5 paiza.io": new PaizaIORunner("swift", "Swift (5.2.5)"),
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
  "C++ GCC 9.2.0 + ACL Wandbox": new WandboxCppRunner("gcc-9.2.0", "C++ (GCC 9.2.0) + ACL"),
};

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

console.info("AtCoder Easy Test: codeRunner OK");

export default {
  // 指定した環境でコードを実行する
  run(languageId: string, sourceCode: string, input: string, expectedOutput: string | null, options: Options = { trim: true, split: true }): Promise<Result> {
    // CodeRunner が存在しない言語ID
    if (!(languageId in runners)) return Promise.reject("Language not supported");

    // 最後に実行したコードを保存
    if (sourceCode.length > 0) codeSaver.save(sourceCode);

    // 実行
    return runners[languageId].test(sourceCode, input, expectedOutput, options);
  },

  // 環境の名前の一覧を取得する
  async getEnvironment(languageId: string): Promise<[string, string][]> {
    const langs = similarLangs(languageId, Object.keys(runners));
    if (langs.length == 0) throw `Undefined language: ${languageId}`;
    return langs.map(lang => [lang, runners[lang].label]);
  },
};