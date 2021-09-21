import codeSaver from "./codeSaver";
import codeRunner from "./codeRunner";
import { version } from "../package.json";
import { TestCase, getTestCases } from "./testcase";
import bottomMenu from "./bottomMenu";
import Options from "./codeRunner/Options";
import Result from "./codeRunner/Result";
import root from "./container.html";

const eAtCoderLang = unsafeWindow.document.querySelector<HTMLSelectElement>("#select-lang>select");

declare const root: HTMLFormElement;

const E = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#atcoder-easy-test-${id}`);

const eLanguage = E<HTMLSelectElement>("language");
const eInput = E<HTMLTextAreaElement>("input");
const eAllowableErrorCheck = E<HTMLInputElement>("allowable-error-check");
const eAllowableError = E<HTMLInputElement>("alloable-error");
const eOutput = E<HTMLTextAreaElement>("output");
const eRun = E<HTMLAnchorElement>("run");

E("version").textContent = version;

async function runTest(title: string, input: string, output: string | null = null): Promise<Result> {
  const uid = Date.now().toString();
  title = title ? "Result " + title : "Result";
  const content = document.createElement("div");
  content.className = "container";
  content.innerHTML = `
  <div class="row">
  <div class="col-xs-12 ${(output == null) ? "" : "col-sm-6"}"><div class="form-group">
  <label class="control-label col-xs-12" for="atcoder-easy-test-${uid}-stdin">Standard Input</label>
  <div class="col-xs-12">
  <textarea id="atcoder-easy-test-${uid}-stdin" class="form-control" rows="3" readonly></textarea>
  </div>
  </div></div>${(output == null) ? "" : `
  <div class="col-xs-12 col-sm-6"><div class="form-group">
  <label class="control-label col-xs-12" for="atcoder-easy-test-${uid}-expected">Expected Output</label>
  <div class="col-xs-12">
  <textarea id="atcoder-easy-test-${uid}-expected" class="form-control" rows="3" readonly></textarea>
  </div>
  </div></div>
  `}
  </div>
  <div class="row"><div class="col-sm-6 col-sm-offset-3">
  <div class="panel panel-default"><table class="table table-condensed">
  <tr>
  <th class="text-center">Exit Code</th>
  <th class="text-center">Exec Time</th>
  <th class="text-center">Memory</th>
  </tr>
  <tr>
  <td id="atcoder-easy-test-${uid}-exit-code" class="text-center"></td>
  <td id="atcoder-easy-test-${uid}-exec-time" class="text-center"></td>
  <td id="atcoder-easy-test-${uid}-memory" class="text-center"></td>
  </tr>
  </table></div>
  </div></div>
  <div class="row">
  <div class="col-xs-12 col-md-6"><div class="form-group">
  <label class="control-label col-xs-12" for="atcoder-easy-test-${uid}-stdout">Standard Output</label>
  <div class="col-xs-12">
  <textarea id="atcoder-easy-test-${uid}-stdout" class="form-control" rows="5" readonly></textarea>
  </div>
  </div></div>
  <div class="col-xs-12 col-md-6"><div class="form-group">
  <label class="control-label col-xs-12" for="atcoder-easy-test-${uid}-stderr">Standard Error</label>
  <div class="col-xs-12">
  <textarea id="atcoder-easy-test-${uid}-stderr" class="form-control" rows="5" readonly></textarea>
  </div>
  </div></div>
  </div>
  `;
  const tab = bottomMenu.addTab("easy-test-result-" + uid, title, content, { active: true, closeButton: true });
  content.querySelector<HTMLTextAreaElement>(`atcoder-easy-test-${uid}-stdin`).value = input;
  if (output != null) content.querySelector<HTMLTextAreaElement>(`#atcoder-easy-test-${uid}-expected`).value = output;
  
  const options: Options = { trim: true, split: true, };
  if (eAllowableErrorCheck.checked) {
    options.allowableError = parseFloat(eAllowableError.value);
  }
  
  const result = await codeRunner.run(eAtCoderLang.value, +eLanguage.value, unsafeWindow.getSourceCode(), input, output, options);
  
  if (result.status == "AC") {
    tab.color = "#dff0d8";
    content.querySelector<HTMLElement>(`#atcoder-easy-test-${uid}-stdout`).style.backgroundColor = "#dff0d8";
  } else if (result.status != "OK") {
    tab.color = "#fcf8e3";
    if (result.status == "WA") content.querySelector<HTMLElement>(`#atcoder-easy-test-${uid}-stdout`).style.backgroundColor = "#fcf8e3";
  }
  
  const eExitCode = content.querySelector<HTMLElement>(`atcoder-easy-test-${uid}-exit-code`);
  eExitCode.textContent = result.exitCode;
  eExitCode.classList.toggle("bg-success", result.exitCode == "0");
  eExitCode.classList.toggle("bg-danger", result.exitCode != "0");
  if ("execTime" in result) content.querySelector<HTMLElement>(`#atcoder-easy-test-${uid}-exec-time`).textContent = result.execTime + " ms";
  if ("memory" in result) content.querySelector<HTMLElement>(`#atcoder-easy-test-${uid}-memory`).textContent = result.memory + " KB";
  content.querySelector<HTMLTextAreaElement>(`#atcoder-easy-test-${uid}-stdout`).value = result.stdout || "";
  content.querySelector<HTMLTextAreaElement>(`#atcoder-easy-test-${uid}-stderr`).value = result.stderr || "";
  
  (result as any).uid = uid;
  (result as any).tab = tab;
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
