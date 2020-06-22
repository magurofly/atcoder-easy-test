// ==UserScript==
// @name Easy Test AtCoder
// @name:ja AtCoderらくらくテスト
// @name:en Easy Test AtCoder
// @namespace https://atcoder.jp/
// @version 0.2.2
// @description:ja AtCoderの問題ページにテストボタンを追加します。
// @description:en Run tests easily
// @author Maguro
// @match https://atcoder.jp/contests/*/tasks/*
// @grant none
// @description AtCoderの問題ページにテストボタンを追加します。
// ==/UserScript==

// using jQuery

(() => {
    "use strict";
	const runFunctions = [];
	const testPath = location.pathname.split("/").slice(0, 3).concat("custom_test", "submit", "json").join("/");
	const readPath = location.pathname.split("/").slice(0, 3).concat("custom_test", "json").join("/") + "?reload=true";

	// get elements
	const container = (() => {
	        let e = $("#task-statement > .lang > span[style]");
	        if (e.length == 0) e = $("#task-statement");
		return e;
	})();
	const testcases = container.find("pre[id]");
	const submissionForm = $("form.form-code-submit");
	const languageIdSelect = submissionForm.find("[name='data.LanguageId']");
    const plainTextarea = submissionForm.find(".plain-textarea");
    const editor = submissionForm.find(".editor").data("editor").doc;
    const toggleEditorButton = submissionForm.find(".btn-toggle-editor");
	const csrfToken = submissionForm.find("[name='csrf_token']").val();

	// utils
	const getBody = input => {
		const languageId = encodeURIComponent(languageIdSelect.val());
		const sourceCode = encodeURIComponent(getSourceCode());
		return `data.LanguageId=${languageId}&sourceCode=${sourceCode}&input=${encodeURIComponent(input)}&csrf_token=${encodeURIComponent(csrfToken)}`;
	};

    const getSourceCode = () => {
        if (toggleEditorButton.hasClass("active")) {
            return plainTextarea.val();
        } else {
            return editor.getValue();
        }
    };

	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

	// for each testcase
	for (let n = testcases.length/2, i = 0; i < n; i++) {
		const input = testcases[i*2];
		const output = testcases[i*2+1];

		const root = $(`<div class="part">
<div class="form-group"><div class="col-sm-5">
	<a id="testcase${i}-run" class="btn btn-primary">Run</a>
</div></div>

<details id="testcase${i}-details" class="row">
	<div class="row"><div class="col-sm-4 col-sm-offset-4">
		<div class="panel panel-default"><table class="table table-bordered">
			<tr id="testcase${i}-exitCodeRow">
				<th class="text-center">Exit Code</th>
				<td id="testcase${i}-exitCode" class="text-right"></td>
			</tr>
			<tr>
				<th class="text-center">Exec Time</th>
				<td id="testcase${i}-execTime" class="text-right"></td>
			</tr>
			<tr>
				<th class="text-center">Memory</th>
				<td id="testcase${i}-memory" class="text-right"></td>
			</tr>
		</table></div>
	</div></div>

	<div class="row"><div class="form-group">
		<label class="control-label col-sm-2" for="testcase${i}-stdout">Standard Output</label>
		<div class="col-sm-8">
			<textarea id="testcase${i}-stdout" class="form-control customtest-textarea" rows="5" readonly></textarea>
		</div>
	</div></div>

	<div class="row"><div class="form-group">
		<label class="control-label col-sm-2" for="testcase${i}-stderr">Standard Error</label>
		<div class="col-sm-8">
			<textarea id="testcase${i}-stderr" class="form-control customtest-textarea" rows="5" readonly></textarea>
		</div>
	</div></div>
</details>
		</div>`);

		const elems = {};
		for (let key of "run details exitCodeRow exitCode execTime memory stdout stderr".split(" ")) {
			elems[key] = root.find(`#testcase${i}-${key}`);
		}

		const runFunction = async () => {
			elems.run.text("Running").append(`<img src="https://img.atcoder.jp/assets/icon/waiting.gif">`).addClass("disabled");
			elems.details[0].open = true;

			await fetch(testPath, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: getBody(input.textContent)
			});

			for (;;) {
				const result = await (await fetch(readPath)).json();
				const rr = result.Result;
				elems.exitCode.text(0);
				elems.exitCodeRow.removeClass().addClass(rr.ExitCode == 0 ? "success" : "danger");
				elems.execTime.text(`${rr.TimeConsumption} ms`);
				elems.memory.text(`${rr.MemoryConsumption} KB`);
				elems.stdout.text(result.Stdout);
				elems.stderr.text(result.Stderr);

				if("Interval" in result) {
					await sleep(result.Interval);
				} else {
					elems.run.text("Run").removeClass("disabled");

					// compare output
					const ac = output.textContent.trim() == result.Stdout.trim();
					elems.stdout.css("background", ac ? "#dff0d8" : "#f2dede");

					return ac;
				}
			}

		};
		runFunctions.push(runFunction);
		elems.run.click(runFunction);

		root.insertAfter(output.parentElement.parentElement);
	}

	const resultView = $(`<div class="alert alert-light"><div>`);
	const testButton = $(`<a class="btn btn-default">Run Test</a>`);
	testButton.click(async () => {
		testButton.text("Test Running").append(`<img src="https://img.atcoder.jp/assets/icon/waiting.gif">`).addClass("disabled");

		resultView.text(`0 / ${runFunctions.length}`).removeClass("alert-success alert-danger").addClass("alert-light");

		let count = 0;
		for (let runFunction of runFunctions) {
			if (await runFunction()) {
				count++;
				resultView.text(`${count} / ${runFunctions.length}`);
			}
		}

		resultView.removeClass("alert-light").addClass(count == runFunctions.length ? "alert-success" : "alert-danger");
		testButton.removeClass("disabled").text("Run Test");
	});
	testButton.insertAfter(submissionForm.find("button[type='submit']"));
	testButton.after(resultView);

})();
