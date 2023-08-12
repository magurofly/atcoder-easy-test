import site from ".";
import TestCase from "../TestCase";
import { ObservableValue } from "../util";

function pairs<T>(list: T[]): [T, T][] {
  const pairs = [];
  const len = list.length >> 1;
  for (let i = 0; i < len; i++) pairs.push([list[i * 2], list[i * 2 + 1]]);
  return pairs;
}

async function init() {
  if (location.host != "atcoder.jp") throw "Not AtCoder";
  const doc = unsafeWindow.document;

  // "言語名 その他の説明..." となっている
  // 注意:
  // * 言語名にはスペースが入ってはいけない（スペース以降は説明とみなされる）
  // * Python2 の言語名は「Python」、 Python3 の言語名は「Python3」
  const langMap = {
    4001: "C GCC 9.2.1",
    4002: "C Clang 10.0.0",
    4003: "C++ GCC 9.2.1",
    4004: "C++ Clang 10.0.0",
    4005: "Java OpenJDK 11.0.6",
    4006: "Python3 CPython 3.8.2",
    4007: "Bash 5.0.11",
    4008: "bc 1.07.1",
    4009: "Awk GNU Awk 4.1.4",
    4010: "C# .NET Core 3.1.201",
    4011: "C# Mono-mcs 6.8.0.105",
    4012: "C# Mono-csc 3.5.0",
    4013: "Clojure 1.10.1.536",
    4014: "Crystal 0.33.0",
    4015: "D DMD 2.091.0",
    4016: "D GDC 9.2.1",
    4017: "D LDC 1.20.1",
    4018: "Dart 2.7.2",
    4019: "dc 1.4.1",
    4020: "Erlang 22.3",
    4021: "Elixir 1.10.2",
    4022: "F# .NET Core 3.1.201",
    4023: "F# Mono 10.2.3",
    4024: "Forth gforth 0.7.3",
    4025: "Fortran GNU Fortran 9.2.1",
    4026: "Go 1.14.1",
    4027: "Haskell GHC 8.8.3",
    4028: "Haxe 4.0.3",
    4029: "Haxe 4.0.3",
    4030: "JavaScript Node.js 12.16.1",
    4031: "Julia 1.4.0",
    4032: "Kotlin 1.3.71",
    4033: "Lua Lua 5.3.5",
    4034: "Lua LuaJIT 2.1.0",
    4035: "Dash 0.5.8",
    4036: "Nim 1.0.6",
    4037: "Objective-C Clang 10.0.0",
    4038: "Lisp SBCL 2.0.3",
    4039: "OCaml 4.10.0",
    4040: "Octave 5.2.0",
    4041: "Pascal FPC 3.0.4",
    4042: "Perl 5.26.1",
    4043: "Raku Rakudo 2020.02.1",
    4044: "PHP 7.4.4",
    4045: "Prolog SWI-Prolog 8.0.3",
    4046: "Python PyPy2 7.3.0",
    4047: "Python3 PyPy3 7.3.0",
    4048: "Racket 7.6",
    4049: "Ruby 2.7.1",
    4050: "Rust 1.42.0",
    4051: "Scala 2.13.1",
    4052: "Java OpenJDK 1.8.0",
    4053: "Scheme Gauche 0.9.9",
    4054: "ML MLton 20130715",
    4055: "Swift 5.2.1",
    4056: "Text cat 8.28",
    4057: "TypeScript 3.8",
    4058: "Basic .NET Core 3.1.101",
    4059: "Zsh 5.4.2",
    4060: "COBOL Fixed OpenCOBOL 1.1.0",
    4061: "COBOL Free OpenCOBOL 1.1.0",
    4062: "Brainfuck bf 20041219",
    4063: "Ada Ada2012 GNAT 9.2.1",
    4064: "Unlambda 2.0.0",
    4065: "Cython 0.29.16",
    4066: "Sed 4.4",
    4067: "Vim 8.2.0460",
    // newjudge-2308
    5001: "C++ 20 gcc 12.2",
    5002: "Go 1.20.6",
    5003: "C# 11.0 .NET 7.0.7",
    5004: "Kotlin 1.8.20",
    5005: "Java OpenJDK 17",
    5006: "Nim 1.6.14",
    5007: "V 0.4",
    5008: "Zig 0.10.1",
    5009: "JavaScript Node.js 18.16.1",
    5010: "JavaScript Deno 1.35.1",
    5011: "R GNU R 4.2.1",
    5012: "D DMD 2.104.0",
    5013: "D LDC 1.32.2",
    5014: "Swift 5.8.1",
    5015: "Dart 3.0.5",
    5016: "PHP 8.2.8",
    5017: "C GCC 12.2.0",
    5018: "Ruby 3.2.2",
    5019: "Crystal 1.9.1",
    5020: "Brainfuck bf 20041219",
    5021: "F# 7.0 .NET 7.0.7",
    5022: "Julia 1.9.2",
    5023: "Bash 5.2.2",
    5024: "Text cat 8.32",
    5025: "Haskell GHC 9.4.5",
    5026: "Fortran GNU Fortran 12.2",
    5027: "Lua LuaJIT 2.1.0-beta3",
    5028: "C++ 23 gcc 12.2",
    5029: "CommonLisp SBCL 2.3.6",
    5030: "COBOL Free GnuCOBOL 3.1.2",
    5031: "C++ 23 Clang 16.0.5",
    5032: "Zsh Zsh 5.9",
    5033: "SageMath SageMath 9.5",
    5034: "Sed GNU sed 4.8",
    5035: "bc bc 1.07.1",
    5036: "dc dc 1.07.1",
    5037: "Perl perl  5.34",
    5038: "AWK GNU Awk 5.0.1",
    5039: "なでしこ cnako3 3.4.20",
    5040: "Assembly x64 NASM 2.15.05",
    5041: "Pascal fpc 3.2.2",
    5042: "C# 11.0 AOT .NET 7.0.7",
    5043: "Lua Lua 5.4.6",
    5044: "Prolog SWI-Prolog 9.0.4",
    5045: "PowerShell PowerShell 7.3.1",
    5046: "Scheme Gauche 0.9.12",
    5047: "Scala 3.3.0 Scala Native 0.4.14",
    5048: "Visual Basic 16.9 .NET 7.0.7",
    5049: "Forth gforth 0.7.3",
    5050: "Clojure babashka 1.3.181",
    5051: "Erlang Erlang 26.0.2",
    5052: "TypeScript 5.1 Deno 1.35.1",
    5053: "C++ 17 gcc 12.2",
    5054: "Rust rustc 1.70.0",
    5055: "Python3 CPython 3.11.4",
    5056: "Scala Dotty 3.3.0",
    5057: "Koka koka 2.4.0",
    5058: "TypeScript 5.1 Node.js 18.16.1",
    5059: "OCaml ocamlopt 5.0.0",
    5060: "Raku Rakudo 2023.06",
    5061: "Vim vim 9.0.0242",
    5062: "Emacs Lisp Native Compile GNU Emacs 28.2",
    5063: "Python3 Mambaforge / CPython 3.10.10",
    5064: "Clojure clojure 1.11.1",
    5065: "プロデル mono版プロデル 1.9.1182",
    5066: "ECLiPSe ECLiPSe 7.1_13",
    5067: "Nibbles literate form nibbles 1.01",
    5068: "Ada GNAT 12.2",
    5069: "jq jq 1.6",
    5070: "Cyber Cyber v0.2-Latest",
    5071: "Carp Carp 0.5.5",
    5072: "C++ 17 Clang 16.0.5",
    5073: "C++ 20 Clang 16.0.5",
    5074: "LLVM IR Clang 16.0.5",
    5075: "Emacs Lisp Byte Compile GNU Emacs 28.2",
    5076: "Factor Factor 0.98",
    5077: "D GDC 12.2",
    5078: "Python3 PyPy 3.10-v7.3.12",
    5079: "Whitespace whitespacers 1.0.0",
    5080: "><> fishr 0.1.0",
    5081: "ReasonML reason 3.9.0",
    5082: "Python Cython 0.29.34",
    5083: "Octave GNU Octave 8.2.0",
    5084: "Haxe JVM Haxe 4.3.1",
    5085: "Elixir Elixir 1.15.2",
    5086: "Mercury Mercury 22.01.6",
    5087: "Seed7 Seed7 3.2.1",
    5088: "Emacs Lisp No Compile GNU Emacs 28.2",
    5089: "Unison Unison M5b",
    5090: "COBOL GnuCOBOLFixed 3.1.2",
  };
  const languageId = new ObservableValue(unsafeWindow.$("#select-lang select.current").val());
  unsafeWindow.$("#select-lang select").change(() => {
    languageId.value = unsafeWindow.$("#select-lang select.current").val();
  });
  const language = languageId.map(lang => langMap[lang]);

  const isTestCasesHere = /^\/contests\/[^\/]+\/tasks\//.test(location.pathname);
  const taskSelector = doc.querySelector<HTMLSelectElement>("#select-task");
  function getTaskURI(): string {
    if (taskSelector) return `${location.origin}/contests/${unsafeWindow.contestScreenName}/tasks/${taskSelector.value}`;
    return `${location.origin}${location.pathname}`;
  }
  interface TestCasesCache {
    testcases?: TestCase[],
    state: "loading" | "loaded" | "error",
  }
  const testcasesCache: { [key: string]: TestCasesCache } = {};
  if (taskSelector) {
    const doFetchTestCases = async () => {
      console.log(`Fetching test cases...: ${getTaskURI()}`);

      const taskURI = getTaskURI();
      const load = !(taskURI in testcasesCache) || testcasesCache[taskURI].state == "error";
      if (!load) return;

      try {
        testcasesCache[taskURI] = { state: "loading" };
        const testcases = await fetchTestCases(taskURI);
        testcasesCache[taskURI] = { testcases, state: "loaded" };
      } catch (e) {
        testcasesCache[taskURI] = { state: "error" };
      }
    }
    unsafeWindow.$("#select-task").change(doFetchTestCases);
    doFetchTestCases();
  }

  async function fetchTestCases(taskUrl: string): Promise<TestCase[]> {
    const html = await fetch(taskUrl).then(res => res.text());
    const taskDoc = new DOMParser().parseFromString(html, "text/html");
    return getTestCases(taskDoc);
  }

  function getTestCases(doc: Document): TestCase[] {
    const selectors = [
      ["#task-statement p+pre.literal-block", ".section"], // utpc2011_1
      ["#task-statement pre.source-code-for-copy", ".part"],
      ["#task-statement .lang>*:nth-child(1) .div-btn-copy+pre", ".part"],
      ["#task-statement .div-btn-copy+pre", ".part"],
      ["#task-statement>.part pre.linenums", ".part"], // abc003_4
      ["#task-statement>.part section>pre", ".part"], // tdpc_number
      ["#task-statement>.part:not(.io-style)>h3+section>pre", ".part"],
      ["#task-statement pre", ".part"],
    ];

    for (const [selector, closestSelector] of selectors) {
      let e = [...doc.querySelectorAll(selector)];
      e = e.filter(e => {
        if (e.closest(".io-style")) return false; // practice2
        if (e.querySelector("var")) return false;
        return true;
      });
      if (e.length == 0) continue;
      return pairs(e).map(([input, output], index) => {
        const container = input.closest(closestSelector) || input.parentElement;
        return {
          selector,
          title: `Sample ${index + 1}`,
          input: input.textContent,
          output: output.textContent,
          anchor: container.querySelector(".btn-copy") || container.querySelector("h1,h2,h3,h4,h5,h6"),
        };
      });
    }

    { // maximum_cup_2018_d
      let e = [...doc.querySelectorAll("#task-statement .div-btn-copy+pre")];
      e = e.filter(f => !f.childElementCount);
      if (e.length) {
        return pairs(e).map(([input, output], index) => ({
          selector: "#task-statement .div-btn-copy+pre",
          title: `Sample ${index + 1}`,
          input: input.textContent,
          output: output.textContent,
          anchor: (input.closest(".part") || input.parentElement).querySelector(".btn-copy"),
        }));
      }
    }

    return [];
  };

  const atcoder = {
    name: "AtCoder",
    language,
    langMap,
    get sourceCode(): string {
      return unsafeWindow.getSourceCode();
    },
    set sourceCode(sourceCode: string) {
      doc.querySelector<HTMLTextAreaElement>(".plain-textarea").value = sourceCode;
      unsafeWindow.$(".editor").data("editor").doc.setValue(sourceCode);
    },
    submit(): void {
      doc.querySelector<HTMLElement>("#submit").click();
    },
    get testButtonContainer(): HTMLElement {
      return doc.querySelector("#submit").parentElement;
    },
    get sideButtonContainer(): HTMLElement {
      return doc.querySelector(".editor-buttons");
    },
    get bottomMenuContainer(): HTMLElement {
      return doc.getElementById("main-div");
    },
    get resultListContainer(): HTMLElement {
      return doc.querySelector(".form-code-submit");
    },
    get testCases(): TestCase[] {
      const taskURI = getTaskURI();
      if (taskURI in testcasesCache && testcasesCache[taskURI].state == "loaded") return testcasesCache[taskURI].testcases;
      if (isTestCasesHere) {
        const testcases = getTestCases(doc);
        testcasesCache[taskURI] = { testcases, state: "loaded" };
        return testcases;
      } else {
        console.error("AtCoder Easy Test v2: Test cases are still not loaded");
        return [];
      }
    },
    get jQuery(): any {
      return unsafeWindow["jQuery"];
    },
    get taskURI(): string {
      return getTaskURI();
    },
  };
  return atcoder;
}

export default init;