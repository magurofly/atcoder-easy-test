import TestCase from "../TestCase";
import { newElement, ObservableValue } from "../util";

async function init() {
  if (location.host != "yukicoder.me") throw "Not yukicoder";

  const $ = unsafeWindow.$;
  const doc = unsafeWindow.document;
  const editor = (unsafeWindow as any).ace.edit("rich_source");
  const eSourceObject = $("#source");
  const eLang = $("#lang");
  const eSamples = $(".sample");

  const langMap = {
    "cpp14": "C++ C++14 GCC 11.1.0 + Boost 1.77.0",
    "cpp17": "C++ C++17 GCC 11.1.0 + Boost 1.77.0",
    "cpp-clang": "C++ C++17 Clang 10.0.0 + Boost 1.76.0",
    "cpp23": "C++ C++11 GCC 8.4.1",
    "c11": "C++ C++11 GCC 11.1.0",
    "c": "C C90 GCC 8.4.1",
    "java8": "Java Java16 OpenJDK 16.0.1",
    "csharp": "C# CSC 3.9.0",
    "csharp_mono": "C# Mono 6.12.0.147",
    "csharp_dotnet": "C# .NET 5.0",
    "perl": "Perl 5.26.3",
    "raku": "Raku Rakudo v2021-07-2-g74d7ff771",
    "php": "PHP 7.2.24",
    "php7": "PHP 8.0.8",
    "python3": "Python3 3.9.6 + numpy 1.14.5 + scipy 1.1.0",
    "pypy2": "Python PyPy2 7.3.5",
    "pypy3": "Python3 PyPy3 7.3.5",
    "ruby": "Ruby 3.0.2p107",
    "d": "D DMD 2.097.1",
    "go": "Go 1.16.6",
    "haskell": "Haskell 8.10.5",
    "scala": "Scala 2.13.6",
    "nim": "Nim 1.4.8",
    "rust": "Rust 1.53.0",
    "kotlin": "Kotlin 1.5.21",
    "scheme": "Scheme Gauche 0.9.10",
    "crystal": "Crystal 1.1.1",
    "swift": "Swift 5.4.2",
    "ocaml": "OCaml 4.12.0",
    "clojure": "Clojure 1.10.2.790",
    "fsharp": "F# 5.0",
    "elixir": "Elixir 1.7.4",
    "lua": "Lua LuaJIT 2.0.5",
    "fortran": "Fortran gFortran 8.4.1",
    "node": "JavaScript Node.js 15.5.0",
    "typescript": "TypeScript 4.3.5",
    "lisp": "Lisp Common Lisp sbcl 2.1.6",
    "sml": "ML Standard ML MLton 20180207-6",
    "kuin": "Kuin KuinC++ v.2021.7.17",
    "vim": "Vim v8.2",
    "sh": "Bash 4.4.19",
    "nasm": "Assembler nasm 2.13.03",
    "clay": "cLay 20210917-1",
    "bf": "Brainfuck BFI 1.1",
    "Whitespace": "Whitespace 0.3",
    "text": "Text cat 8.3",
  };

  // place anchor elements
  for (const btnCopyInput of doc.querySelectorAll(".copy-sample-input")) {
    btnCopyInput.parentElement.insertBefore(newElement("span", { className: "atcoder-easy-test-anchor" }), btnCopyInput);
  }

  const language = new ObservableValue(langMap[eLang.val()]);
  eLang.on("change", () => {
    language.value = langMap[eLang.val()];
  });

  return {
    name: "yukicoder",
    language,
    get sourceCode(): string {
      if (eSourceObject.is(":visible")) return eSourceObject.val();
      return editor.getSession().getValue();
    },
    set sourceCode(sourceCode: string) {
      eSourceObject.val(sourceCode);
      editor.getSession().setValue(sourceCode);
    },
    submit(): void {
      doc.querySelector<HTMLElement>(`#submit_form input[type="submit"]`).click();
    },
    get testButtonContainer(): HTMLElement {
      return doc.querySelector("#submit_form");
    },
    get sideButtonContainer(): HTMLElement {
      return doc.querySelector("#toggle_source_editor").parentElement;
    },
    get bottomMenuContainer(): HTMLElement {
      return doc.body;
    },
    get resultListContainer(): HTMLElement {
      return doc.querySelector("#content");
    },
    get testCases(): TestCase[] {
      const testCases = [];
      let sampleId = 1;
      for (let i = 0; i < eSamples.length; i++) {
        const eSample = eSamples.eq(i);
        const [eInput, eOutput] = eSample.find("pre");
        testCases.push({
          title: `Sample ${sampleId++}`,
          input: eInput.textContent,
          output: eOutput.textContent,
          anchor: eSample.find(".atcoder-easy-test-anchor")[0],
        });
      }
      return testCases;
    },
    get jQuery(): any {
      return $;
    },
    get taskURI(): string {
      return location.href;
    },
  };
}

export default init;