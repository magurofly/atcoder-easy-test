import codeSaver from "../codeSaver";

import Result from "./Result";
import Options from "./Options";
import CodeRunner from "./CodeRunner";
import CustomRunner from "./CustomRunner";
import AtCoderRunner from "./AtCoderRunner";
import PaizaIORunner from "./PaizaIORunner";
import WandboxRunner from "./WandboxRunner";
import WandboxCppRunner from "./WandboxCppRunner";
import brythonRunner from "./brythonRunner";

const runners = {
  "4001": [new WandboxRunner("gcc-10.1.0-c", "C (GCC 10.1.0)")],
  "4002": [new PaizaIORunner("c", "C (C17 / Clang 10.0.0)", )],
  "4003": [new WandboxCppRunner("gcc-10.1.0", "C++ (GCC 10.1.0)", {options: "warning,boost-1.73.0-gcc-9.2.0,gnu++17"})],
  "4004": [new WandboxCppRunner("clang-10.0.0", "C++ (Clang 10.0.0)", {options: "warning,boost-nothing-clang-10.0.0,c++17"})],
  "4006": [
      new PaizaIORunner("python3", "Python (3.8.2)"),
      brythonRunner,
  ],
  "4007": [new PaizaIORunner("bash", "Bash (5.0.17)")],
  "4010": [new WandboxRunner("csharp", "C# (.NET Core 6.0.100-alpha.1.20562.2)")],
  "4011": [new WandboxRunner("mono-head", "C# (Mono-mcs 5.19.0.0)")],
  "4013": [new PaizaIORunner("clojure", "Clojure (1.10.1-1)")],
  "4017": [new PaizaIORunner("d", "D (LDC 1.23.0)")],
  "4020": [new PaizaIORunner("erlang", "Erlang (10.6.4)")],
  "4021": [new PaizaIORunner("elixir", "Elixir (1.10.4)")],
  "4022": [new PaizaIORunner("fsharp", "F# (Interactive 4.0)")],
  "4023": [new PaizaIORunner("fsharp", "F# (Interactive 4.0)")],
  "4026": [new WandboxRunner("go-1.14.1", "Go (1.14.1)")],
  "4027": [new WandboxRunner("ghc-head", "Haskell (GHC 8.7.20181121)")],
  "4030": [new PaizaIORunner("javascript", "JavaScript (Node.js 12.18.3)")],
  "4032": [new PaizaIORunner("kotlin", "Kotlin (1.4.0)")],
  "4033": [new WandboxRunner("lua-5.3.4", "Lua (Lua 5.3.4)")],
  "4034": [new WandboxRunner("luajit-head", "Lua (LuaJIT 2.1.0-beta3)")],
  "4036": [new WandboxRunner("nim-1.0.6", "Nim (1.0.6)")],
  "4037": [new PaizaIORunner("objective-c", "Objective-C (Clang 10.0.0)")],
  "4039": [new WandboxRunner("ocaml-head", "OCaml (4.13.0+dev0-2020-10-19)")],
  "4041": [new WandboxRunner("fpc-3.0.2", "Pascal (FPC 3.0.2)")],
  "4042": [new PaizaIORunner("perl", "Perl (5.30.0)")],
  "4044": [
      new PaizaIORunner("php", "PHP (7.4.10)"),
      new WandboxRunner("php-7.3.3", "PHP (7.3.3)"),
  ],
  "4046": [new WandboxRunner("pypy-head", "PyPy2 (7.3.4-alpha0)")],
  "4047": [new WandboxRunner("pypy-7.2.0-3", "PyPy3 (7.2.0)")],
  "4049": [
      new PaizaIORunner("ruby", "Ruby (2.7.1)"),
      new WandboxRunner("ruby-head", "Ruby (HEAD 3.0.0dev)"),
      new WandboxRunner("ruby-2.7.0-preview1", "Ruby (2.7.0-preview1)"),
  ],
  "4050": [
      new AtCoderRunner("4050", "Rust (1.42.0)"),
      new WandboxRunner("rust-head", "Rust (1.37.0-dev)"),
      new PaizaIORunner("rust", "Rust (1.43.0)"),
  ],
  "4051": [new PaizaIORunner("scala", "Scala (2.13.3)")],
  "4053": [new PaizaIORunner("scheme", "Scheme (Gauche 0.9.6)")],
  "4055": [new PaizaIORunner("swift", "Swift (5.2.5)")],
  "4056": [new CustomRunner("Text",
      async (sourceCode, input) => {
          return {
              status: "OK",
              exitCode: "0",
              stdout: sourceCode,
          };
      }
  )],
  "4058": [new PaizaIORunner("vb", "Visual Basic (.NET Core 4.0.1)")],
  "4061": [new PaizaIORunner("cobol", "COBOL - Free (OpenCOBOL 2.2.0)")],
  "4101": [new WandboxCppRunner("gcc-9.2.0", "C++ (GCC 9.2.0)")],
  "4102": [new WandboxCppRunner("clang-10.0.0", "C++ (Clang 10.0.0)")],
};

for (const e of document.querySelectorAll("#select-lang option[value]")) {
  const languageId = (e as HTMLOptionElement).value;

  // 特別な CodeRunner が定義されていない言語ID
  if (!(languageId in runners)) runners[languageId] = [];

  // AtCoderRunner がない場合は、追加する
  if (runners[languageId].some((runner: CodeRunner) => runner instanceof AtCoderRunner)) continue;
  runners[languageId].push(new AtCoderRunner(languageId, e.textContent));
}

console.info("AtCoder Easy Test: codeRunner OK");

export default {
  // 指定した環境でコードを実行する
  run(languageId: string, index: number, sourceCode: string, input: string, supposedOutput: string | null, options: Options = { trim: true, split: true }): Promise<Result> {
    // CodeRunner が存在しない言語ID
    if (!(languageId in runners)) return Promise.reject("Language not supported");
    if (!(index in runners[languageId])) return Promise.reject(`Runner index out of range: [0, ${runners[languageId].length})`);

    // 最後に実行したコードを保存
    codeSaver.save(sourceCode);

    // 実行
    return runners[languageId][index].test(sourceCode, input, supposedOutput, options);
  },

  // 環境の名前の一覧を取得する
  async getEnvironment(languageId: string): Promise<string[]> {
    if (!(languageId in runners)) throw "language not supported";
    return runners[languageId].map((runner: CodeRunner) => runner.label);
  },
};