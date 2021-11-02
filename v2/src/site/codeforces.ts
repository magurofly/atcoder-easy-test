import config from "../config";
import Editor from "../editor";
import TestCase from "../TestCase";
import langMap from "./codeforcesLangMap";
import { ObservableValue, loadScript, newElement, events } from "../util";

config.registerFlag("site.codeforces.showEditor", true, "Show Editor in Codeforces Problem Page");

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
  if (config.get("site.codeforces.showEditor", true)) {
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