import codeSaver from "./codeSaver";
import codeRunner from "./codeRunner";
import TestCase from "./TestCase";
import initBottomMenu from "./bottomMenu";
import resultList from "./resultList";
import pSite from "./site";
import config from "./config";
import version from "./version";

import { doneOrFail, events, html2element, newElement, uuid } from "./util";
import ResultTabContent from "./ResultTabContent";
import Options from "./codeRunner/Options";
import Result from "./codeRunner/Result";
import BottomMenuTab from "./bottomMenu/BottomMenuTab";

import hRoot from "./container.html";
import hStyle from "./style.html";
import hRunButton from "./runButton.html";
import hTestAndSubmit from "./testAndSubmit.html";
import hTestAllSamples from "./testAllSamples.html";
import { check } from "prettier";
import settings from "./settings";

(async () => {

const site = await pSite;

const doc = unsafeWindow.document;

// init bottomMenu
const pBottomMenu = initBottomMenu();
pBottomMenu.then(bottomMenu => {
  unsafeWindow.bottomMenu = bottomMenu;
});
await doneOrFail(pBottomMenu);

// external interfaces
unsafeWindow.codeRunner = codeRunner;

doc.head.appendChild(html2element(hStyle));

// interface
const atCoderEasyTest = {
  version,
  site,
  config,
  codeSaver,
  enableButtons() {
    events.trig("enable");
  },
  disableButtons() {
    events.trig("disable");
  },
  runCount: 0,
  runTest(title: string, language: string, sourceCode: string, input: string, output: string | null = null, options: Options = { trim: true, split: true, }): [Promise<Result>, Promise<BottomMenuTab>] {
    this.disableButtons();

    const content = new ResultTabContent();
    const pTab = pBottomMenu.then(bottomMenu => bottomMenu.addTab("easy-test-result-" + content.uid, `#${++this.runCount} ${title}`, content.element, { active: true, closeButton: true }));

    const pResult = codeRunner.run(language, sourceCode, input, output, options);

    pResult.then(result => {
      content.result = result;
      
      if (result.status == "AC") {
        pTab.then(tab => tab.color = "#dff0d8");
      } else if (result.status != "OK") {
        pTab.then(tab => tab.color = "#fcf8e3");
      }
    }).finally(() => {
      this.enableButtons();
    })

    return [pResult, pTab];
  }
};
(unsafeWindow as any).atCoderEasyTest = atCoderEasyTest;

// place "Easy Test" tab
{

  // declare const hRoot: string;
  const root = html2element(hRoot) as HTMLFormElement;

  const E = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#atcoder-easy-test-${id}`);

  const eLanguage = E<HTMLSelectElement>("language");
  const eInput = E<HTMLTextAreaElement>("input");
  const eAllowableErrorCheck = E<HTMLInputElement>("allowable-error-check");
  const eAllowableError = E<HTMLInputElement>("allowable-error");
  const eOutput = E<HTMLTextAreaElement>("output");
  const eRun = E<HTMLAnchorElement>("run");
  const eSetting = E<HTMLAnchorElement>("setting");
  const eVersion = E<HTMLSpanElement>("version");

  eVersion.textContent = atCoderEasyTest.version.current;

  events.on("enable", () => {
    eRun.classList.remove("disabled");
  });
  events.on("disable", () => {
    eRun.classList.add("disabled");
  });

  eSetting.addEventListener("click", () => {
    settings.open();
  });

  // バージョン確認
  {
    let button = null;
    const showButton = () => {
      if (!version.hasUpdate) return;
      if (button) {
        button.textContent = `Update to v${version.latest}`;
        return;
      }
      console.info(`AtCoder Easy Test: New version available: v${version}`);
      button = newElement("a", {
        href: "https://github.com/magurofly/atcoder-easy-test/raw/main/v2/atcoder-easy-test.user.js",
        target: "_blank",
        className: "btn btn-xs btn-info",
        textContent: `Update to v${version.latest}`,
      });
      eVersion.insertAdjacentElement("afterend", button);
    };
    version.latestProperty.addListener(showButton);
    showButton();
  }

  // 言語選択関係
  {
    eLanguage.addEventListener("change", async () => {
      const langSelection = config.get("langSelection", {});
      langSelection[site.language.value] = eLanguage.value;
      config.set("langSelection", langSelection);
      config.save();
    });

    async function setLanguage() {
      const languageId = site.language.value;
      while (eLanguage.firstChild) eLanguage.removeChild(eLanguage.firstChild);
      try {
        if (!languageId) throw new Error("AtCoder Easy Test: language not set");
        const langs = await codeRunner.getEnvironment(languageId);
        console.log(`AtCoder Easy Test: language = ${langs[1]} (${langs[0]})`);

        // add <option>
        for (const [languageId, label] of langs) {
          const option = document.createElement("option");
          option.value = languageId;
          option.textContent = label;
          eLanguage.appendChild(option);
        }

        // load
        const langSelection = config.get("langSelection", {});
        if (languageId in langSelection) {
          const prev = langSelection[languageId];
          if (langs.some(([lang, _]) => lang == prev)) {
            eLanguage.value = prev;
          }
        }

        events.trig("enable");
      } catch (error) {
        console.log(`AtCoder Easy Test: language = ? (${languageId})`);
        console.error(error);
        const option = document.createElement("option");
        option.className = "fg-danger";
        option.textContent = error;
        eLanguage.appendChild(option);
        events.trig("disable");
      }
    }

    site.language.addListener(() => setLanguage());
    eAllowableError.disabled = !eAllowableErrorCheck.checked;
    eAllowableErrorCheck.addEventListener("change", event => {
      eAllowableError.disabled = !eAllowableErrorCheck.checked;
    });
  }

  // テスト実行
  function runTest(title: string, input: string, output: string | null = null, options: Options = {}): [Promise<Result>, Promise<BottomMenuTab>] {
    const opts = Object.assign({ trim: true, split: true, }, options);
    if (eAllowableErrorCheck.checked) {
      opts.allowableError = parseFloat(eAllowableError.value);
    }

    return atCoderEasyTest.runTest(title, eLanguage.value, site.sourceCode, input, output, opts);
  }

  function runAllCases(testcases: TestCase[]): Promise<Result[]> {
    const runGroupId = uuid();
    const pairs = testcases.map(testcase => runTest(testcase.title, testcase.input, testcase.output, { runGroupId }));
    resultList.addResult(pairs);
    return Promise.all(pairs.map(([pResult, _]) => pResult.then(result => {
      if (result.status == "AC") return Promise.resolve(result);
      else return Promise.reject(result);
    })));
  }

  eRun.addEventListener("click", _ => {
    const title = "Run";
    const input = eInput.value;
    const output = eOutput.value;
    runTest(title, input, output || null);
  });

  await doneOrFail(pBottomMenu.then(bottomMenu => bottomMenu.addTab("easy-test", "Easy Test", root)));

  // place "Run" button on each sample
  for (const testCase of site.testCases) {
    const eRunButton = html2element(hRunButton) as HTMLAnchorElement;
    eRunButton.addEventListener("click", async () => {
      const [pResult, pTab] = runTest(testCase.title, testCase.input, testCase.output);
      await pResult;
      (await pTab).show();
    });
    testCase.anchor.insertAdjacentElement("afterend", eRunButton);
    events.on("disable", () => {
      eRunButton.classList.add("disabled");
    });
    events.on("enable", () => {
      eRunButton.classList.remove("disabled");
    });
  }

  // place "Test & Submit" button
  {
    const button = html2element(hTestAndSubmit) as HTMLElement;
    site.testButtonContainer.appendChild(button);
    const testAndSubmit = async () => {
      await runAllCases(site.testCases);
      site.submit();
    };
    button.addEventListener("click", testAndSubmit);
    events.on("testAndSubmit", testAndSubmit);
    events.on("disable", () => button.classList.add("disabled"));
    events.on("enable", () => button.classList.remove("disabled"));
  }

  // place "Test All Samples" button
  {
    const button = html2element(hTestAllSamples) as HTMLElement;
    site.testButtonContainer.appendChild(button);
    const testAllSamples = () => runAllCases(site.testCases);
    button.addEventListener("click", testAllSamples);
    events.on("testAllSamples", testAllSamples);
    events.on("disable", () => button.classList.add("disabled"));
    events.on("enable", () => button.classList.remove("disabled"));
  }
}

// place "Restore Last Play" button
try {
  const restoreButton = doc.createElement("a");
  restoreButton.className = "btn btn-danger btn-sm";
  restoreButton.textContent = "Restore Last Play";
  restoreButton.addEventListener("click", async () => {
    try {
      const lastCode = await codeSaver.restore(site.taskURI);
      if (site.sourceCode.length == 0 || confirm("Your current code will be replaced. Are you sure?")) {
        site.sourceCode = lastCode;
      }
    } catch (reason) {
      alert(reason);
    }
  });
  site.sideButtonContainer.appendChild(restoreButton);
} catch(e) {
  console.error(e);
}

codeRunner;

// キーボードショートカット
config.registerFlag("ui.useKeyboardShortcut", true, "Use Keyboard Shortcuts");
unsafeWindow.addEventListener("keydown", (event: KeyboardEvent) => {
  if (config.get("ui.useKeyboardShortcut", true)) {
    if (event.key == "Enter" && event.ctrlKey) {
      events.trig("testAndSubmit");
    } else if (event.key == "Enter" && event.altKey) {
      events.trig("testAllSamples");
    } else if (event.key == "Escape" && event.altKey) {
      pBottomMenu.then(bottomMenu => bottomMenu.toggle());
    }
  }
});

})();