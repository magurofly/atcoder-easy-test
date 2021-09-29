import codeSaver from "./codeSaver";
import codeRunner from "./codeRunner";
import { TestCase, getTestCases } from "./testcase";
import bottomMenu from "./bottomMenu";
import resultList from "./resultList";

import { events, html2element } from "./util";
import ResultTabContent from "./ResultTabContent";
import Options from "./codeRunner/Options";
import Result from "./codeRunner/Result";
import BottomMenuTab from "./bottomMenu/BottomMenuTab";

import hRoot from "./container.html";
import hStyle from "./style.html";
import hTestAndSubmit from "./testAndSubmit.html";
import hTestAllSamples from "./testAllSamples.html";

const doc = unsafeWindow.document;
const $ = unsafeWindow.$;
const $select = <E extends HTMLElement>(selector: string): E => doc.querySelector<E>(selector);

// external interfaces
unsafeWindow.bottomMenu = bottomMenu;
unsafeWindow.codeRunner = codeRunner;

doc.head.appendChild(html2element(hStyle));

// place "Easy Test" tab
{
  const eAtCoderLang = $select<HTMLSelectElement>("#select-lang>select");
  const eSubmitButton = doc.getElementById("submit");

  // declare const hRoot: string;
  const root = html2element(hRoot) as HTMLFormElement;

  const E = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#atcoder-easy-test-${id}`);

  const eLanguage = E<HTMLSelectElement>("language");
  const eInput = E<HTMLTextAreaElement>("input");
  const eAllowableErrorCheck = E<HTMLInputElement>("allowable-error-check");
  const eAllowableError = E<HTMLInputElement>("allowable-error");
  const eOutput = E<HTMLTextAreaElement>("output");
  const eRun = E<HTMLAnchorElement>("run");

  E("version").textContent = "$_ATCODER_EASY_TEST_VERSION";

  events.on("enable", () => {
    eRun.classList.remove("disabled");
  });
  events.on("disable", () => {
    eRun.classList.remove("enabled");
  });

  // 言語選択関係
  {
    async function setLanguage() {
      const languageId = eAtCoderLang.value;
      while (eLanguage.firstChild) eLanguage.removeChild(eLanguage.firstChild);
      try {
        const labels = await codeRunner.getEnvironment(languageId);
        console.log(`language: ${labels[0]} (${languageId})`);
        labels.forEach((label, index) => {
          const option = document.createElement("option");
          option.value = String(index);
          option.textContent = label;
          eLanguage.appendChild(option);
        });
        events.trig("enable");
      } catch (error) {
        console.log(`language: ? (${languageId})`);
        console.error(error);
        const option = document.createElement("option");
        option.className = "fg-danger";
        option.textContent = error;
        eLanguage.appendChild(option);
        events.trig("disable");
      }
    }

    unsafeWindow.$(eAtCoderLang).change(() => setLanguage()); //NOTE: This event is only for jQuery; do not replace with Vanilla
    eAllowableError.disabled = !eAllowableErrorCheck.checked;
    eAllowableErrorCheck.addEventListener("change", event => {
      eAllowableError.disabled = !eAllowableErrorCheck.checked;
    });

    setLanguage();
  }

  let runId = 0;

  // テスト実行
  function runTest(title: string, input: string, output: string | null = null): [Promise<Result>, BottomMenuTab] {
    runId++;

    events.trig("disable");
    
    const options: Options = { trim: true, split: true, };
    if (eAllowableErrorCheck.checked) {
      options.allowableError = parseFloat(eAllowableError.value);
    }

    const content = new ResultTabContent();
    const tab = bottomMenu.addTab("easy-test-result-" + content.uid, `#${runId} ${title}`, content.element, { active: true, closeButton: true });

    const pResult = codeRunner.run(eAtCoderLang.value, +eLanguage.value, unsafeWindow.getSourceCode(), input, output, options);

    pResult.then(result => {
      content.result = result;
      
      if (result.status == "AC") {
        tab.color = "#dff0d8";
      } else if (result.status != "OK") {
        tab.color = "#fcf8e3";
      }

      events.trig("enable");
    });

    return [pResult, tab];
  }

  function runAllCases(testcases: TestCase[]): Promise<Result[]> {
    const pairs = testcases.map(testcase => runTest(testcase.title, testcase.input, testcase.output));
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

  bottomMenu.addTab("easy-test", "Easy Test", root);

  // place "Test & Submit" button
  {
    const button = html2element(hTestAndSubmit);
    eSubmitButton.parentElement.appendChild(button);
    button.addEventListener("click", async () => {
      await runAllCases(getTestCases());
      eSubmitButton.click();
    });
  }

  // place "Test All Samples" button
  {
    const button = html2element(hTestAllSamples);
    eSubmitButton.parentElement.appendChild(button);
    button.addEventListener("click", () => runAllCases(getTestCases()));
  }
}

// place "Restore Last Play" button
try {
  const restoreButton = doc.createElement("a");
  restoreButton.className = "btn btn-danger btn-sm";
  restoreButton.textContent = "Restore Last Play";
  restoreButton.addEventListener("click", async () => {
    try {
      const lastCode = await codeSaver.restore();
      if (confirm("Your current code will be replaced. Are you sure?")) {
        $select<HTMLTextAreaElement>(".plain-textarea").value = lastCode;
        $(".editor").data("editor").doc.setValue(lastCode);
      }
    } catch (reason) {
      alert(reason);
    }
  });
  $select(".editor-buttons").appendChild(restoreButton);
} catch(e) {
  console.error(e);
}

codeRunner;