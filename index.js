// ==UserScript==
// @name         AtCoder Easy Test
// @namespace    http://atcoder.jp/
// @version      0.1.3
// @description  Make testing sample cases easy
// @author       magurofly
// @match        https://atcoder.jp/contests/*/tasks/*
// @grant        none
// ==/UserScript==

// This script uses variables from page below:
// * `$`
// * `getSourceCode`

// This scripts consists of three modules:
// * bottom menu
// * code runner
// * view

// -- bottom menu --
if (!window.bottomMenu) { var bottomMenu = (function () {
    'use strict';

    const tabs = new Set();

    $(() => {
        $(`<style>`)
            .text(`

#bottom-menu-wrapper {
    background: transparent;
    border: none;
    pointer-events: none;
    padding: 0;
}

#bottom-menu-wrapper>.container {
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 0;
}

#bottom-menu-wrapper>.container>.navbar-header {
    float: none;
}

#bottom-menu-key {
    display: block;
    float: none;
    margin: 0 auto;
    padding: 10px 3em;
    border-radius: 5px 5px 0 0;
    background: #000;
    opacity: 0.85;
    color: #FFF;
    cursor: pointer;
    pointer-events: auto;
    text-align: center;
}

#bottom-menu-key.collapsed:before {
    content: "\\e260";
}

#bottom-menu-tabs {
    padding: 3px 0 0 10px;
}

#bottom-menu-tabs a {
    pointer-events: auto;
}

#bottom-menu {
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    max-height: unset;
}

#bottom-menu.collapse:not(.in) {
    display: none !important;
}

#bottom-menu-tabs>li>a {
    background: rgba(100, 100, 100, 0.5);
    border: solid 1px #ccc;
    color: #fff;
}

#bottom-menu-tabs>li>a:hover {
    background: rgba(150, 150, 150, 0.5);
    border: solid 1px #ccc;
    color: #333;
}

#bottom-menu-tabs>li.active>a {
    background: #eee;
    border: solid 1px #ccc;
    color: #333;
}

.bottom-menu-btn-close {
    font-size: 8pt;
    vertical-align: baseline;
    padding: 0 0 0 6px;
    margin-right: -6px;
}

#bottom-menu-contents {
    padding: 5px 15px;
    max-height: 50vh;
    overflow-y: auto;
}

#bottom-menu-contents .panel {
    color: #333;
}



#atcoder-easy-test-language {
    border: none;
    background: transparent;
    font: inherit;
    color: #fff;
}

`)
            .appendTo("head");
        $(`<div id="bottom-menu-wrapper" class="navbar navbar-default navbar-fixed-bottom">`)
            .html(`
<div class="container">
    <div class="navbar-header">
        <button id="bottom-menu-key" type="button" class="navbar-toggle collapsed glyphicon glyphicon-menu-down" data-toggle="collapse" data-target="#bottom-menu">
        </button>
    </div>
    <div id="bottom-menu" class="collapse navbar-collapse">
        <ul id="bottom-menu-tabs" class="nav nav-tabs">
        </ul>
        <div id="bottom-menu-contents" class="tab-content">
        </div>
    </div>
</div>
`)
            .appendTo("#main-div");
    });

    const menuController = {
        addTab(tabId, tabLabel, paneContent, options = {}) {
            const tab = $(`<a id="bottom-menu-tab-${tabId}" href="#" data-target="#bottom-menu-pane-${tabId}" data-toggle="tab">`)
            .click(e => {
                e.preventDefault();
                tab.tab("show");
            })
            .append(tabLabel);
            const tabLi = $(`<li>`).append(tab).appendTo("#bottom-menu-tabs");
            const pane = $(`<div class="tab-pane" id="bottom-menu-pane-${tabId}">`).append(paneContent).appendTo("#bottom-menu-contents");
            const controller = {
                close() {
                    tabLi.remove();
                    pane.remove();
                    tabs.delete(tab);
                    if (tabLi.hasClass("active") && tabs.size > 0) {
                        tabs.values().next().value.tab("show");
                    }
                },

                show() {
                    menuController.show();
                    tab.tab("show");
                }
            };
            tabs.add(tab);
            if (options.closeButton) tab.append($(`<a class="bottom-menu-btn-close btn btn-link glyphicon glyphicon-remove">`).click(() => controller.close()));
            if (options.active || tabs.size == 1) tab.tab("show");
            return controller;
        },

        show() {
            if ($("#bottom-menu-key").hasClass("collapsed")) $("#bottom-menu-key").click();
        },
    };

    return menuController;
})(); }

// -- code runner --
var codeRunner = (function() {
    'use strict';

    function buildParams(data) {
        return Object.entries(data).map(([key, value]) =>
                                            encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&");
    }

    class WandboxRunner {
        constructor(name, label, options = {}) {
            this.name = name;
            this.label = label + " [Wandbox]";
        }

        run(sourceCode, input) {
            return this.request(Object.assign(JSON.stringify({
                compiler: this.name,
                code: sourceCode,
                stdin: input,
            }), this.options));
        }

        async request(body) {
            const startTime = Date.now();
            let res;
            try {
                res = await fetch("https://wandbox.org/api/compile.json", {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body,
                }).then(r => r.json());
            } catch (error) {
                return {
                    status: "IE",
                    stderr: error,
                };
            }
            const endTime = Date.now();

            const result = {
                status: "OK",
                exitCode: res.status,
                execTime: endTime - startTime,
                stdout: res.program_output,
                stderr: res.program_error,
            };
            if (res.status != 0) {
                if (res.signal) {
                    result.exitCode += " (" + res.signal + ")";
                }
                if (res.compiler_error) {
                    result.status = "CE";
                    result.stdout = res.compiler_output;
                    result.stderr = res.compiler_error;
                } else {
                    result.status = "RE";
                }
            }

            return result;
        }
    }

    class PaizaIORunner {
        constructor(name, label) {
            this.name = name;
            this.label = label + "[PaizaIO]";
        }

        async run(sourceCode, input) {
            let id, status, error;
            try {
                const res = await fetch("https://api.paiza.io/runners/create?" + buildParams({
                    source_code: sourceCode,
                    language: this.name,
                    input,
                    longpoll: true,
                    longpoll_timeout: 10,
                    api_key: "guest",
                }), {
                    method: "POST",
                    mode: "cors",
                }).then(r => r.json());
                id = res.id;
                status = res.status;
                error = res.error;
            } catch (error) {
                return {
                    status: "IE",
                    stderr: error,
                };
            }

            while (status == "running") {
                const res = await (await fetch("https://api.paiza.io/runners/get_status?" + buildParams({
                    id,
                    api_key: "guest",
                }), {
                    mode: "cors",
                })).json();
                status = res.status;
                error = res.error;
            }

            const res = await fetch("https://api.paiza.io/runners/get_details?" + buildParams({
                id,
                api_key: "guest",
            }), {
                mode: "cors",
            }).then(r => r.json());

            const result = {
                exitCode: res.exit_code,
                execTime: +res.time * 1e3,
                memory: +res.memory * 1e-3,
            };

            if (res.build_result == "failure") {
                result.status = "CE";
                result.exitCode = res.build_exit_code;
                result.stdout = res.build_stdout;
                result.stderr = res.build_stderr;
            } else {
                result.status = (res.result == "timeout") ? "TLE" : (res.result == "failure") ? "RE" : "OK";
                result.exitCode = res.exit_code;
                result.stdout = res.stdout;
                result.stderr = res.stderr;
            }

            return result;
        }
    }

    const wandboxJavaRunner = new WandboxRunner("openjdk-jdk-11+28", "Java (openjdk-11+28)");
    wandboxJavaRunner.run = function (sourceCode, input) {
        return this.request(JSON.stringify({
            compiler: this.name,
            code: `
public class prog {
    public static void main(String[] args) {
        Main.main(args);
    }
}
            `,
            codes: [{
                file: "Main.java",
                code: sourceCode,
            }],
            stdin: input,
        }));
    };

    const runners = {
        4001: new WandboxRunner("gcc-9.2.0-c", "C (GCC 9.2.0)"),
        4002: new PaizaIORunner("c", "C (C17 / Clang 10.0.0)"),
        4003: new WandboxRunner("gcc-9.2.0", "C++ (GCC 9.2.0)"),
        4004: new PaizaIORunner("cpp", "C++ (C17++ / Clang 10.0.0)"),
        4005: wandboxJavaRunner,
        4006: new PaizaIORunner("python3", "Python (3.8.2)"),
        4007: new PaizaIORunner("bash", "Bash (5.0.17)"),
        4010: new PaizaIORunner("csharp", "C# (Mono-mcs 6.8.0.105)"),
        4011: new PaizaIORunner("csharp", "C# (Mono-mcs 6.8.0.105)"),
        4012: new PaizaIORunner("csharp", "C# (Mono-mcs 6.8.0.105)"),
        4013: new PaizaIORunner("clojure", "Clojure (1.10.1-1)"),
        4015: new PaizaIORunner("d", "D (LDC 1.23.0)"),
        4016: new PaizaIORunner("d", "D (LDC 1.23.0)"),
        4017: new PaizaIORunner("d", "D (LDC 1.23.0)"),
        4020: new PaizaIORunner("erlang", "Erlang (10.6.4)"),
        4021: new PaizaIORunner("elixir", "Elixir (1.10.4)"),
        4022: new PaizaIORunner("fsharp", "F# (Interactive 4.0)"),
        4023: new PaizaIORunner("fsharp", "F# (Interactive 4.0)"),
        4026: new PaizaIORunner("go", "Go (1.15)"),
        4027: new PaizaIORunner("haskell", "Haskell (GHC 8.6.5)"),
        4030: new PaizaIORunner("javascript", "JavaScript (Node.js 12.18.3)"),
        4032: new PaizaIORunner("kotlin", "Kotlin (1.4.0)"),
        4035: new PaizaIORunner("bash", "Bash (5.0.17)"),
        4037: new PaizaIORunner("objective-c", "Objective-C (Clang 10.0.0)"),
        4042: new PaizaIORunner("perl", "Perl (5.30.0)"),
        4043: new PaizaIORunner("perl", "Perl (5.30.0)"),
        4044: new PaizaIORunner("php", "PHP (7.4.10)"),
        4046: new PaizaIORunner("python", "Python (2.7.18rc1)"),
        4047: new PaizaIORunner("python3", "Python (3.8.2)"),
        4049: new PaizaIORunner("ruby", "Ruby (2.7.1)"),
        4050: new PaizaIORunner("rust", "Rust (1.43.0)"),
        4051: new PaizaIORunner("scala", "Scala (2.13.3)"),
        4052: new PaizaIORunner("java", "Java (OpenJDK 15)"),
        4053: new PaizaIORunner("scheme", "Scheme (Gauche 0.9.6)"),
        4055: new PaizaIORunner("swift", "Swift (5.2.5)"),
        4058: new PaizaIORunner("vb", "Visual Basic (.NET Core 4.0.1)"),
        4060: new PaizaIORunner("cobol", "COBOL - Free (OpenCOBOL 2.2.0)"),
        4061: new PaizaIORunner("cobol", "COBOL - Free (OpenCOBOL 2.2.0)"),
    };

    return {
        run(languageId, sourceCode, input) {
            if (!(languageId in runners)) {
                return Promise.reject("language not supported");
            }
            return runners[languageId].run(sourceCode, input);
        },

        getEnvironment(languageId) {
            if (!(languageId in runners)) {
                return Promise.reject("language not supported");
            }
            return Promise.resolve(runners[languageId].label);
        },
    };
})();

(function () {
    function setLanguage() {
        const languageId = $("#select-lang>select").val();
        codeRunner.getEnvironment(languageId).then(label => {
            $("#atcoder-easy-test-language").css("color", "#fff").val(label);
            $("#atcoder-easy-test-run").removeClass("disabled");
        }, error => {
            $("#atcoder-easy-test-language").css("color", "#f55").val(error);
            $("#atcoder-easy-test-run").addClass("disabled");
        });
    }
    setLanguage();

    async function runTest(input, title = "") {
        const uid = Date.now().toString();
        title = title ? "Result " + title : "Result";
        const content = $(`<div class="container">`)
        .html(`
<div class="row"><div class="form-group">
    <label class="control-label col-sm-2" for="atcoder-easy-test-${uid}-stdin">Standard Input</label>
    <div class="col-sm-8">
        <textarea id="atcoder-easy-test-${uid}-stdin" class="form-control" rows="5" readonly></textarea>
    </div>
</div></div>
<div class="row"><div class="col-sm-4 col-sm-offset-4">
        <div class="panel panel-default"><table class="table table-bordered">
            <tr id="atcoder-easy-test-${uid}-row-exit-code">
                <th class="text-center">Exit Code</th>
                <td id="atcoder-easy-test-${uid}-exit-code" class="text-right"></td>
            </tr>
            <tr id="atcoder-easy-test-${uid}-row-exec-time">
                <th class="text-center">Exec Time</th>
                <td id="atcoder-easy-test-${uid}-exec-time" class="text-right"></td>
            </tr>
            <tr id="atcoder-easy-test-${uid}-row-memory">
                <th class="text-center">Memory</th>
                <td id="atcoder-easy-test-${uid}-memory" class="text-right"></td>
            </tr>
        </table></div>
</div></div>
<div class="row"><div class="form-group">
    <label class="control-label col-sm-2" for="atcoder-easy-test-${uid}-stdout">Standard Output</label>
    <div class="col-sm-8">
        <textarea id="atcoder-easy-test-${uid}-stdout" class="form-control" rows="5" readonly></textarea>
    </div>
</div></div>
<div class="row"><div class="form-group">
    <label class="control-label col-sm-2" for="atcoder-easy-test-${uid}-stderr">Standard Error</label>
    <div class="col-sm-8">
        <textarea id="atcoder-easy-test-${uid}-stderr" class="form-control" rows="5" readonly></textarea>
    </div>
</div></div>
`);
        const tab = bottomMenu.addTab("easy-test-result-" + uid, title, content, { active: true, closeButton: true });
        $(`#atcoder-easy-test-${uid}-stdin`).val(input);

        const result = await codeRunner.run($("#select-lang>select").val(), getSourceCode(), input);

        $(`#atcoder-easy-test-${uid}-row-exit-code`).toggleClass("bg-danger", result.exitCode != 0).toggleClass("bg-success", result.exitCode == 0);
        $(`#atcoder-easy-test-${uid}-exit-code`).text(result.exitCode);
        if ("execTime" in result) $(`#atcoder-easy-test-${uid}-exec-time`).text(result.execTime + " ms");
        if ("memory" in result) $(`#atcoder-easy-test-${uid}-memory`).text(result.memory + " KB");
        $(`#atcoder-easy-test-${uid}-stdout`).val(result.stdout);
        $(`#atcoder-easy-test-${uid}-stderr`).val(result.stderr);

        result.uid = uid;
        result.tab = tab;
        return result;
    }

    bottomMenu.addTab("easy-test", "Easy Test", $(`<form id="atcoder-easy-test-container" class="form-horizontal">`)
                      .html(`
<div class="row">
    <div class="col-12 col-md-10">
        <div class="form-group">
            <label class="control-label col-sm-2">Test Environment</label>
            <div class="col-sm-8">
                <input id="atcoder-easy-test-language" class="form-control" readonly>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-12 col-md-10">
        <div class="form-group">
            <label class="control-label col-sm-2" for="atcoder-easy-test-input">Standard Input</label>
            <div class="col-sm-8">
                <textarea id="atcoder-easy-test-input" name="input" class="form-control" rows="5"></textarea>
            </div>
        </div>
    </div>
    <div class="col-12 col-md-4">
        <label class="control-label col-sm-2"></label>
        <div class="form-group">
            <div class="col-sm-8">
                 <a id="atcoder-easy-test-run" class="btn btn-primary">Run</a>
            </div>
        </div>
    </div>
</div>
`), { active: true });
    $("#atcoder-easy-test-run").click(() => runTest($("#atcoder-easy-test-input").val()));
    $("#select-lang>select").on("change", () => setLanguage());

    const testfuncs = [];

    const testcases = $(".lang>span:nth-child(1) .div-btn-copy+pre[id]").toArray();
    for (let i = 0; i < testcases.length; i += 2) {
        const input = $(testcases[i]), output = $(testcases[i+1]);
        const testfunc = async () => {
            const title = input.closest(".part").find("h3")[0].childNodes[0].data;
            const result = await runTest(input.text(), title);
            if (result.status == "OK") {
                if (result.stdout.trim() == output.text().trim()) {
                    $(`#atcoder-easy-test-${result.uid}-stdout`).addClass("bg-success");
                    result.status = "AC";
                } else {
                    result.status = "WA";
                }
            }
            return result;
        };
        testfuncs.push(testfunc);

        const runButton = $(`<a class="btn btn-primary btn-sm" style="vertical-align: top; margin-left: 0.5em">`)
        .text("Run")
        .click(async () => {
            await testfunc();
            if ($("#bottom-menu-key").hasClass("collapsed")) $("#bottom-menu-key").click();
        });
        input.closest(".part").find(".btn-copy").eq(0).after(runButton);
    }

    const testAllResultRow = $(`<div class="row">`);
    const testAllButton = $(`<a class="btn btn-default btn-sm" style="margin-left: 5px">`)
    .text("Test All Samples")
    .click(async () => {
        const statuses = testfuncs.map(_ => $(`<div class="label label-default" style="margin: 3px">`).text("WJ..."));
        const progress = $(`<div class="progress-bar">`).text(`0 / ${testfuncs.length}`);
        let finished = 0;
        const closeButton = $(`<button type="button" class="close" data-dismiss="alert" aria-label="close">`)
        .append($(`<span aria-hidden="true">`).text("\xd7"));
        const resultAlert = $(`<div class="alert alert-dismissible">`)
        .append(closeButton)
        .append($(`<div class="progress">`).append(progress))
        .append(...statuses)
        .appendTo(testAllResultRow);
        const results = await Promise.all(testfuncs.map(async (testfunc, i) => {
            const result = await testfunc();
            finished++;
            progress.text(`${finished} / ${statuses.length}`).css("width", `${finished/statuses.length*100}%`);
            statuses[i].toggleClass("label-success", result.status == "AC").toggleClass("label-warning", result.status != "AC").text(result.status).click(() => result.tab.show()).css("cursor", "pointer");
            return result;
        }));
        if (results.every(({status}) => status == "AC")) {
            resultAlert.addClass("alert-success");
        } else {
            resultAlert.addClass("alert-warning");
        }
        closeButton.click(() => {
            for (const {tab} of results) {
                tab.close();
            }
        });
    });
    $("#submit").after(testAllButton).closest("form").append(testAllResultRow);
})();
