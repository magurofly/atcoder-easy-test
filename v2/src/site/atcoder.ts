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
    5041: "Pascal FPC 3.2.2",
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
    5054: "Rust 1.70.0",
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
    // 
    6001: "><> fishr 0.1.0",
    6002: "Ada 2022 GNAT 15.2.0",
    6003: "APL GNU APL 1.9",
    6004: "Assembly MIPS O32 ABI GNU assembler 2.42",
    6005: "Assembly x64 NASM 2.16.03",
    6006: "AWK GNU awk 5.2.1",
    6007: "A interpreter af48a2a",
    6008: "Bash 5.3",
    6009: "Basic FreeBASIC 1.10.1",
    6010: "bc GNU bc 1.08.2",
    6011: "Befunge 93 TBC 1.0",
    6012: "Brainfuck Tritium 1.2.73",
    6013: "C 23 Clang Clang 21.1.0",
    6014: "C 23 GCC 14.2.0",
    6015: "C# 13.0 .NET 9.0.8",
    6016: "C# 13.0 .NET Native AOT 9.0.8",
    6017: "C++ 23 GCC 15.2.0",
    6018: "C3 0.7.5",
    6019: "Carp 0.5.5",
    6020: "cLay 20250308-1 GCC 15.2.0",
    6021: "Clojure babashka 1.12.208",
    6022: "Clojure 1.12.2",
    6023: "Clojure 1.12.2 AOT",
    6025: "Clojure 1.12.2 ClojureScript 1.12.42 Node.js 22.19.0",
    6026: "COBOL Free GnuCOBOL 3.2",
    6027: "CommonLisp SBCL 2.5.8",
    6028: "Crystal 1.17.0",
    6029: "Cyber 0.3",
    6030: "D DMD 2.111.0",
    6031: "D GDC 15.2",
    6032: "D LDC 1.41.0",
    6033: "Dart 3.9.2",
    6034: "dc 1.5.2 GNU bc 1.08.2",
    6035: "ECLiPSe 7.1_13",
    6036: "Eiffel Gobo Eiffel 22.01",
    6037: "Eiffel Liberty Eiffel 07829e3",
    6038: "Elixir 1.18.4 OTP 28.0.2",
    6039: "EmacsLisp (Native Compile) GNU Emacs 29.4",
    6040: "Emojicode 1.0 beta 2 emojicodec 1.0 beta 2",
    6041: "Erlang 28.0.2",
    6042: "F# 9.0 .NET 9.0.8",
    6043: "Factor 0.100",
    6044: "Fish 4.0.2",
    6045: "Forth gforth 0.7.3",
    6046: "Fortran2018 Flang 20.1.7",
    6047: "Fortran2023 GCC 14.2.0",
    6048: "FORTRAN77 GCC 14.2.0",
    6049: "Gleam 1.12.0 OTP 28.0.2",
    6050: "Go 1.18 gccgo 15.2.0",
    6051: "Go 1.25.1",
    6052: "Haskell GHC 9.8.4",
    6053: "Haxe JVM Haxe 4.3.7 hxjava 4.2.0",
    6054: "C++ GCC 14.2.0 IOI-Style(GNU++20)",
    6055: "ISLisp Easy-ISLisp 5.43",
    6056: "Java 24 OpenJDK 24.0.2",
    6057: "JavaScript Bun 1.2.21",
    6058: "JavaScript Deno 2.4.5",
    6059: "JavaScript Node.js 22.19.0",
    6060: "Jule 0.1.6",
    6061: "Koka 3.2.2",
    6062: "Kotlin 2.2.10",
    6063: "Kuin kuincl v.2021.8.17",
    6064: "LazyK irori v1.0.0",
    6065: "Lean 4.22.0",
    6066: "LLVMIR Clang 21.1.0",
    6067: "Lua 5.4.7",
    6068: "Lua LuaJIT 2.1.1703358377",
    6069: "Mercury 22.01.8",
    6071: "Nim Nim 1.6.20",
    6072: "Nim Nim 2.2.4",
    6073: "OCaml ocamlopt 5.3.0",
    6074: "Octave GNU Octave 10.2.0",
    6075: "Pascal FPC 3.2.2",
    6076: "Perl 5.38.2",
    6077: "PHP 8.4.12",
    6078: "Piet your-diary/piet_programming_language 3.0.0 (PPM image)",
    6079: "Pony 0.59.0",
    6080: "PowerShell 7.5.2",
    6081: "Prolog SWI-Prolog 9.2.9",
    6082: "Python3 CPython 3.13.7",
    6083: "Python3 PyPy 3.11-v7.3.20",
    6084: "R GNU R 4.5.0",
    6085: "ReasonML reson 3.16.0",
    6086: "Ruby 3.3 truffleruby 25.0.0",
    6087: "Ruby 3.4.5",
    6088: "Rust 1.89.0",
    6089: "SageMath 10.7",
    6090: "Scala 3.7.2 Dotty",
    6091: "Scala 3.7.2 Scala Native 0.5.8",
    6092: "Scheme ChezScheme 10.2.0",
    6093: "Scheme Gauche 0.9.15",
    6094: "Seed7 Seed7 3.5.0",
    6095: "Swift 6.2",
    6096: "Tcl 9.0.1",
    6097: "Terra 1.2.0",
    6098: "TeX 3.141592653",
    6099: "Text cat 9.4",
    6100: "TypeScript 5.8 Deno 2.4.5",
    6101: "TypeScript 5.9 tsc 5.9.2 Bun 1.2.21",
    6102: "TypeScript 5.9 tsc 5.9.2 Node.js 22.19.0",
    6103: "Uiua 0.16.2",
    6104: "Unison 0.5.47",
    6105: "V 0.4.10",
    6106: "Vala 0.56.18",
    6107: "Verilog 2012 Icarus Verilog 12.0",
    6108: "Veryl 0.16.4",
    6109: "WebAssembly wabt 1.0.34 + iwasm 2.4.1",
    6110: "Whitespace whitespacers 1.3.0",
    6111: "Zig 0.15.1",
    6112: "なでしこ cnako3 3.7.8 Node.js 22.19.0",
    6113: "プロデル mono版プロデル 2.0.1353",
    6114: "Julia 1.11.6",
    6115: "Python Codon 0.19.3",
    6116: "C++ 23 Clang 21.1.0",
    6117: "Fix 1.1.0-alpha.12",
    6118: "SQL DuckDB 1.3.2",
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
      const $ = unsafeWindow.document.querySelector.bind(unsafeWindow.document);
      if (typeof unsafeWindow["ace"] != "undefined") {
        if (!$(".btn-toggle-editor").classList.contains("active")) {
          return unsafeWindow["ace"].edit($("#editor")).getValue();
        } else {
          return $("#plain-textarea").value;
        }
      } else {
        return unsafeWindow.getSourceCode();
      }
    },
    set sourceCode(sourceCode: string) {
      const $ = unsafeWindow.document.querySelector.bind(unsafeWindow.document);
      if (typeof unsafeWindow["ace"] != "undefined") {
        unsafeWindow["ace"].edit($("#editor")).setValue(sourceCode);
        $("#plain-textarea").value = sourceCode;
      } else {
        doc.querySelector<HTMLTextAreaElement>(".plain-textarea").value = sourceCode;
        unsafeWindow.$(".editor").data("editor").doc.setValue(sourceCode);
      }
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