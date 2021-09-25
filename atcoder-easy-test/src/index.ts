import { html2element } from "./util";
import codeSaver from "./codeSaver";
import codeRunner from "./codeRunner";
import ResultTabContent from "./ResultTabContent";
import { TestCase, getTestCases } from "./testcase";
import bottomMenu from "./bottomMenu";
import Options from "./codeRunner/Options";
import Result from "./codeRunner/Result";
import hRoot from "./container.html";

const eAtCoderLang = unsafeWindow.document.querySelector<HTMLSelectElement>("#select-lang>select");

declare const hRoot: string;
const root = html2element(hRoot) as HTMLFormElement;

const E = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#atcoder-easy-test-${id}`);

const eLanguage = E<HTMLSelectElement>("language");
const eInput = E<HTMLTextAreaElement>("input");
const eAllowableErrorCheck = E<HTMLInputElement>("allowable-error-check");
const eAllowableError = E<HTMLInputElement>("alloable-error");
const eOutput = E<HTMLTextAreaElement>("output");
const eRun = E<HTMLAnchorElement>("run");

E("version").textContent = "$_ATCODER_EASY_TEST_VERSION";

async function runTest(title: string, input: string, output: string | null = null): Promise<Result> {
  const content = new ResultTabContent();
  content.input = input;
  if (output) content.expectedOutput = output;
  const tab = bottomMenu.addTab("easy-test-result-" + content.uid, title, content.element, { active: true, closeButton: true });
  const options: Options = { trim: true, split: true, };
  if (eAllowableErrorCheck.checked) {
    options.allowableError = parseFloat(eAllowableError.value);
  }
  
  const result = await codeRunner.run(eAtCoderLang.value, +eLanguage.value, unsafeWindow.getSourceCode(), input, output, options);
  
  if (result.status == "AC") {
    tab.color = "#dff0d8";
    content.outputStyle.backgroundColor = "#dff0d8";
  } else if (result.status != "OK") {
    tab.color = "#fcf8e3";
    content.outputStyle.backgroundColor = "#fcf8e3";
  }
  
  content.exitCode = result.exitCode;
  if ("execTime" in result) content.execTime = `${result.execTime} ms`;
  if ("memory" in result) content.memory = `${result.memory} KB`;
  if ("stdout" in result) content.output = result.stdout;
  if ("stderr" in result) content.error = result.stderr;

  return result;
}

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
    eRun.classList.remove("disabled");
    E("btn-test-all").classList.remove("disabled");
  } catch (error) {
    console.log(`language: ? (${languageId})`);
    const option = document.createElement("option");
    option.className = "fg-danger";
    option.textContent = error;
    eLanguage.appendChild(option);
    eRun.classList.add("disabled");
    E("btn-test-all").classList.add("disabled");
  }
}

eRun.addEventListener("click", _ => {
  const title = "";
  const input = eInput.value;
  const output = eOutput.value;
  runTest(title, input, output || null);
});

unsafeWindow.$(eAtCoderLang).change(() => setLanguage()); //NOTE: This event is only for jQuery; do not replace with Vanilla
eAllowableError.disabled = !eAllowableErrorCheck.checked;
eAllowableErrorCheck.addEventListener("change", event => {
  eAllowableError.disabled = !eAllowableErrorCheck.checked;
});

setLanguage();

bottomMenu.addTab("easy-test", "Easy Test", root);
