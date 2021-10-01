import TestCase from "../TestCase";
import { ObservableValue } from "../util";

let codeforces = null;

function init() {
  const $ = unsafeWindow.$;
  const doc = unsafeWindow.document;
  const editor = (unsafeWindow as any).ace.edit("rich_source");
  const eSourceObject = $("#source");
  const eLang = $("#lang");
  const eSamples = $(".sample");

  const langMap = {
  };

  const language = new ObservableValue(langMap[eLang.val()]);
  eLang.on("change", () => {
    language.value = langMap[eLang.val()];
  });

  codeforces = {
    name: "Codeforces",
    language,
    get sourceCode(): string {
      const eFile = doc.querySelector<HTMLFormElement>(".submitForm").elements["sourceFile"];
      if (eFile.files[0]) {
        return new TextDecoder().decode(eFile.files[0].arrayBuffer);
      }
      //TODO: 提出欄を追加したりする
      throw "No source code";
    },
    set sourceCode(sourceCode: string) {
      const container = new DataTransfer();
      container.items.add(new File([sourceCode], "prog.txt", { type: "text/plain" }))
      const eFile = doc.querySelector<HTMLFormElement>(".submitForm").elements["sourceFile"];
      eFile.files = container.files;
      //TODO: 追加した提出欄に設定
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
          anchor: eSample.find("button")[0],
        });
      }
      return testCases;
    },
  };
}

if (location.host == "codeforces.com") init();
//TODO: m1.codeforces.com, m2.codeforces.com, m3.codeforces.com に対応する

export default codeforces;