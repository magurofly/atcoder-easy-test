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
  const eLanguage = unsafeWindow.$("#select-lang>select");

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
  };

  const languageId = new ObservableValue(eLanguage.val());
  eLanguage.change(() => {
    languageId.value = eLanguage.val();
  });

  const language = languageId.map(lang => langMap[lang]);

  function getTestCases(): TestCase[] {
    const selectors = [
      ["#task-statement p+pre.literal-block", ".section"], // utpc2011_1
      ["#task-statement pre.source-code-for-copy", ".part"],
      ["#task-statement .lang>*:nth-child(1) .div-btn-copy+pre", ".part"],
      ["#task-statement .div-btn-copy+pre", ".part"],
      ["#task-statement>.part pre.linenums", ".part"], // abc003_4
      ["#task-statement>.part:not(.io-style)>h3+section>pre", ".part"],
      ["#task-statement pre", ".part"],
    ];
    
    for (const [selector, closestSelector] of selectors) {
      let e = [... doc.querySelectorAll(selector)];
      e = e.filter(e => !e.closest(".io-style")); // practice2
      if (e.length == 0) continue;
      return pairs(e).map(([input, output], index) => ({
        title: `Sample ${index + 1}`,
        input: input.textContent,
        output: output.textContent,
        anchor: (input.closest(closestSelector) || input.parentElement).querySelector(".btn-copy"),
      }));
    }

    { // maximum_cup_2018_d
      let e = [... doc.querySelectorAll("#task-statement .div-btn-copy+pre")];
      e = e.filter(f => !f.childElementCount);
      if (e.length) {
        return pairs(e).map(([input, output], index) => ({
          title: `Sample ${index + 1}`,
          input: input.textContent,
          output: output.textContent,
          anchor: (input.closest(".part") || input.parentElement).querySelector(".btn-copy"),
        }));
      }
    }
    
    return [];
  };


  return {
    name: "AtCoder",
    language,
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
      return getTestCases();
    },
    get jQuery(): any {
      return unsafeWindow["jQuery"];
    },
  };
}

export default init;