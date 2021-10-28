import config from "../config";
import Editor from "../editor";
import TestCase from "../TestCase";
import { ObservableValue, loadScript, newElement, events } from "../util";

config.registerFlag("codeforces.showEditor", true, "Show Editor in Codeforces Problem Page");

async function init() {
  if (location.host != "codeforces.com") throw "not Codeforces";
  //TODO: m1.codeforces.com, m2.codeforces.com, m3.codeforces.com に対応する

  const doc = unsafeWindow.document;
  const eLang = doc.querySelector<HTMLSelectElement>("select[name='programTypeId']");

  doc.head.appendChild(newElement("link", {
    rel: "stylesheet",
    href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  }));

  const eButtons = newElement("span");
  doc.querySelector(".submitForm").appendChild(eButtons);

  await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
  const jQuery = unsafeWindow["jQuery"].noConflict();
  unsafeWindow["jQuery"] = unsafeWindow["$"];
  unsafeWindow["jQuery11"] = jQuery;
  await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });

  const langMap = {
    3: "Delphi 7",
    4: "Pascal Free Pascal 3.0.2",
    6: "PHP 7.2.13",
    7: "Python 2.7.18",
    9: "C# Mono 6.8",
    12: "Haskell GHC 8.10.1",
    13: "Perl 5.20.1",
    19: "OCaml 4.02.1",
    20: "Scala 2.12.8",
    28: "D DMD32 v2.091.0",
    31: "Python3 3.8.10",
    32: "Go 1.15.6",
    34: "JavaScript V8 4.8.0",
    36: "Java 1.8.0_241",
    40: "Python PyPy2 2.7 (7.3.0)",
    41: "Python3 PyPy3 3.7 (7.3.0)",
    43: "C C11 GCC 5.1.0",
    48: "Kotlin 1.5.31",
    49: "Rust 1.49.0",
    50: "C++ C++14 G++ 6.4.0",
    51: "Pascal PascalABC.NET 3.4.1",
    52: "C++ C++17 Clang++",
    54: "C++ C++17 G++ 7.3.0",
    55: "JavaScript Node.js 12.6.3",
    59: "C++ Microsoft Visual C++ 2017",
    60: "Java 11.0.6",
    61: "C++ C++17 9.2.0 (64 bit, msys 2)",
    65: "C# 8, .NET Core 3.1",
    67: "Ruby 3.0.0",
    70: "Python3 PyPy 3.7 (7.3.5, 64bit)",
    72: "Kotlin 1.5.31",
    73: "C++ GNU G++ 11.2.0 (64 bit, winlibs)",
  };

  const language = new ObservableValue(langMap[eLang.value]);
  eLang.addEventListener("change", () => {
    language.value = langMap[eLang.value];
  });

  let _sourceCode = "";
  const eFile = doc.querySelector<HTMLFormElement>(".submitForm").elements["sourceFile"];
  eFile.addEventListener("change", async () => {
    if (eFile.files[0]) {
      _sourceCode = await eFile.files[0].text();
      if (editor) editor.sourceCode = _sourceCode;
    }
  });

  let editor = null;
  let waitCfFastSubmitCount = 0;
  const waitCfFastSubmit = setInterval(() => {
    if (document.getElementById("editor")) {
      // cf-fast-submit

      if (editor && editor.element) editor.element.style.display = "none";

      // 言語セレクトを同期させる
      const eLang2 = doc.querySelector<HTMLSelectElement>(".submit-form select[name='programTypeId']");
      if (eLang2) {
        eLang.addEventListener("change", () => {
          eLang2.value = eLang.value;
        });
        eLang2.addEventListener("change", () => {
          eLang.value = eLang2.value;
          language.value = langMap[eLang.value];
        });
      }

      // TODO: 選択されたファイルをどうかする

      // エディタを使う
      const aceEditor = unsafeWindow["ace"].edit("editor");
      editor = {
        get sourceCode() {
          return aceEditor.getValue();
        },
        set sourceCode(sourceCode) {
          aceEditor.setValue(sourceCode);
        },
        setLanguage(lang: string) {},
      };

      // ボタンを追加する
      const buttonContainer = doc.querySelector(".submit-form .submit").parentElement;
      buttonContainer.appendChild(newElement("a", {
        className: "btn btn-info",
        textContent: "Test & Submit",
        onclick: () => events.trig("testAndSubmit"),
      }));
      buttonContainer.appendChild(newElement("a", {
        className: "btn btn-default",
        textContent: "Test All Samples",
        onclick: () => events.trig("testAllSamples"),
      }));

      clearInterval(waitCfFastSubmit);
    } else {
      waitCfFastSubmitCount++;
      if (waitCfFastSubmitCount >= 100) clearInterval(waitCfFastSubmit);
    }
  }, 100);
  if (config.get("codeforces.showEditor", true)) {
    editor = new Editor(langMap[eLang.value].split(" ")[0]);
    doc.getElementById("pageContent").appendChild(editor.element);
    language.addListener(lang => {
      editor.setLanguage(lang);
    });
  }

  return {
    name: "Codeforces",
    language,
    get sourceCode(): string {
      if (editor) return editor.sourceCode;
      return _sourceCode;
    },
    set sourceCode(sourceCode: string) {
      const container = new DataTransfer();
      container.items.add(new File([sourceCode], "prog.txt", { type: "text/plain" }))
      const eFile = doc.querySelector<HTMLFormElement>(".submitForm").elements["sourceFile"];
      eFile.files = container.files;
      _sourceCode = sourceCode;
      if (editor) editor.sourceCode = sourceCode;
    },
    submit(): void {
      if (editor) _sourceCode = editor.sourceCode;
      this.sourceCode = _sourceCode;
      doc.querySelector<HTMLElement>(`.submitForm .submit`).click();
    },
    get testButtonContainer(): HTMLElement {
      return eButtons;
    },
    get sideButtonContainer(): HTMLElement {
      return eButtons;
    },
    get bottomMenuContainer(): HTMLElement {
      return doc.body;
    },
    get resultListContainer(): HTMLElement {
      return doc.querySelector("#pageContent");
    },
    get testCases(): TestCase[] {
      return [... doc.querySelectorAll(".sample-test")].map((e, i) => ({
        title: `Sample ${i + 1}`,
        input: e.querySelector(".input pre").textContent,
        output: e.querySelector(".output pre").textContent,
        anchor: e.querySelector(".input .title"),
      }));
    },
    get jQuery(): any {
      return jQuery;
    },
  };
}

export default init;