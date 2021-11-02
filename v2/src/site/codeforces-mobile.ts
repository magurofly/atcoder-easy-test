import config from "../config";
import Editor from "../editor";
import TestCase from "../TestCase";
import langMap from "./codeforcesLangMap";
import { ObservableValue, loadScript, newElement, events } from "../util";

config.registerFlag("site.codeforcesMobile.showEditor", true, "Show Editor in Mobile Codeforces (m[1-3].codeforces.com) Problem Page");

async function init() {
  if (!/^m[1-3]\.codeforces\.com$/.test(location.host)) throw "not Codeforces Mobile";

  const url = /\/contest\/(\d+)\/problem\/([^/]+)/.exec(location.pathname);
  const contestId = url[1];
  const problemId = url[2];

  const doc = unsafeWindow.document;
  const main = doc.querySelector("main");

  doc.head.appendChild(newElement("link", {
    rel: "stylesheet",
    href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  }));

  await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js");

  const language = new ObservableValue("");
  let submit = () => {};
  let getSourceCode = () => "";
  let setSourceCode = (_: string) => {};

  // make Editor
  if (config.get("site.codeforcesMobile.showEditor", true)) {
    const frame = newElement<HTMLIFrameElement>("iframe", {
      src: `/contest/${contestId}/submit`,
      style: {
        display: "none",
      },
    });
    doc.body.appendChild(frame);
    await new Promise(done => frame.onload = done);
    const fdoc = frame.contentDocument;
    const form = fdoc.querySelector<HTMLFormElement>("._SubmitPage_submitForm");

    form.elements["problemIndex"].value = problemId;
    form.elements["problemIndex"].readonly = true;

    form.elements["programTypeId"].addEventListener("change", function () {
      language.value = langMap[this.value];
    });

    for (const row of form.children) {
      if (row.tagName != "DIV") continue;
      row.classList.add("form-group");
      const control = row.querySelector("*[name]");
      if (control) control.classList.add("form-control");
    }

    form.parentElement.removeChild(form);
    main.appendChild(form);

    submit = () => form.submit();
    getSourceCode = () => form.elements["source"].value;
    setSourceCode = sourceCode => {
      form.elements["source"].value = sourceCode;
    }
  }

  return {
    name: "Codeforces",
    language,
    get sourceCode(): string {
      return getSourceCode();
    },
    set sourceCode(sourceCode: string) {
      setSourceCode(sourceCode);
    },
    submit,
    get testButtonContainer(): HTMLElement {
      return main;
    },
    get sideButtonContainer(): HTMLElement {
      return main;
    },
    get bottomMenuContainer(): HTMLElement {
      return doc.body;
    },
    get resultListContainer(): HTMLElement {
      return main;
    },
    get testCases(): TestCase[] {
      const testcases = [];
      let index = 1;
      for (const container of doc.querySelectorAll(".sample-test")) {
        const input = container.querySelector(".input pre.content").textContent;
        const output = container.querySelector(".output pre.content").textContent;
        const anchor = container.querySelector(".input .title");
        testcases.push({
          input, output, anchor,
          title: `Sample ${index++}`,
        });
      }
      return testcases;
    },
    get jQuery(): any {
      return unsafeWindow["jQuery"];
    },
  };
}

export default init;