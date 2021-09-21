import { version } from "../../package.json";
import { TestCase, getTestCases } from "./testcase";
import eForm from "./container.html";

async function runTest(title, input, output = null) {
  const uid = Date.now().toString();
  title = title ? "Result " + title : "Result";
  const content = $create("div", { class: "container" });
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
  $id(`atcoder-easy-test-${uid}-stdin`).value = input;
  if (output != null) $id(`atcoder-easy-test-${uid}-expected`).value = output;

  const options = { trim: true, split: true, };
  if ($id("atcoder-easy-test-allowable-error-check").checked) {
    options.allowableError = parseFloat($id("atcoder-easy-test-allowable-error").value);
  }

  const result = await codeRunner.run($select("#select-lang>select").value, +$id("atcoder-easy-test-language").value, window.getSourceCode(), input, output, options);

  if (result.status == "AC") {
    tab.color = "#dff0d8";
    $id(`atcoder-easy-test-${uid}-stdout`).style.backgroundColor = "#dff0d8";
  } else if (result.status != "OK") {
    tab.color = "#fcf8e3";
    if (result.status == "WA") $id(`atcoder-easy-test-${uid}-stdout`).style.backgroundColor = "#fcf8e3";
  }

  const eExitCode = $id(`atcoder-easy-test-${uid}-exit-code`);
  eExitCode.textContent = result.exitCode;
  eExitCode.classList.toggle("bg-success", result.exitCode == 0);
  eExitCode.classList.toggle("bg-danger", result.exitCode != 0);
  if ("execTime" in result) $id(`atcoder-easy-test-${uid}-exec-time`).textContent = result.execTime + " ms";
  if ("memory" in result) $id(`atcoder-easy-test-${uid}-memory`).textContent = result.memory + " KB";
  $id(`atcoder-easy-test-${uid}-stdout`).value = result.stdout || "";
  $id(`atcoder-easy-test-${uid}-stderr`).value = result.stderr || "";

  result.uid = uid;
  result.tab = tab;
  return result;
}

eForm.querySelector("#atcoder-easy-test-version").textContent = version;
bottomMenu.addTab("easy-test", "Easy Test", eForm);

