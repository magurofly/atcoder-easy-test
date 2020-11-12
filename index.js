// ==UserScript==
// @name         AtCoder Easy Test
// @namespace    http://atcoder.jp/
// @version      0.1.2
// @description  Make testing sample cases easy
// @author       magurofly
// @match        https://atcoder.jp/contests/*/tasks/*
// @grant        none
// ==/UserScript==

// This script uses variables from page below:
// * `$`
// * `getSourceCode`

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

(function() {
    'use strict';

    let languageName = null;

    const languageIdMap = {
        4001: "c", 4002: "c",
        4003: "cpp", 4004: "cpp",
        4005: "java", 4052: "java",
        4046: "python",
        4006: "python3", 4047: "python3",
        4007: "bash", 4035: "bash",
        4010: "csharp", 4011: "csharp", 4012: "csharp",
        4013: "clojure",
        4015: "d", 4016: "d", 4017: "d",
        4020: "erlang",
        4021: "elixir",
        4022: "fsharp", 4023: "fsharp",
        4026: "go",
        4027: "haskell",
        4030: "javascript",
        4032: "kotlin",
        4037: "objective-c",
        4042: "perl", 4043: "perl",
        4044: "php",
        4049: "ruby",
        4050: "rust",
        4051: "scala",
        4053: "scheme",
        4055: "swift",
        4058: "vb",
        4060: "cobol", 4061: "cobol",
    };

    const languageLabelMap = {
        c: "C (C17 / Clang 10.0.0)",
        cpp: "C++ (C17++ / Clang 10.0.0)",
        java: "Java (OpenJDK 15)",
        python: "Python (2.7.18rc1)",
        python3: "Python (3.8.2)",
        bash: "Bash (5.0.17)",
        csharp: "C# (Mono-mcs 6.8.0.105)",
        clojure: "Clojure (1.10.1-1)",
        d: "D (LDC 1.23.0)",
        erlang: "Erlang (10.6.4)",
        elixir: "Elixir (1.10.4)",
        fsharp: "F# (Interactive 4.0)",
        go: "Go (1.15)",
        haskell: "Haskell (GHC 8.6.5)",
        javascript: "JavaScript (Node.js 12.18.3)",
        kotlin: "Kotlin (1.4.0)",
        "objective-c": "Objective-C (Clang 10.0.0)",
        perl: "Perl (5.30.0)",
        php: "PHP (7.4.10)",
        ruby: "Ruby (2.7.1)",
        rust: "Rust (1.43.0)",
        scala: "Scala (2.13.3)",
        scheme: "Scheme (Gauche 0.9.6)",
        swift: "Swift (5.2.5)",
        vb: "Visual Basic (.NET Core 4.0.1)",
        cobol: "COBOL - Free (OpenCOBOL 2.2.0)",
    };

    function setLanguage() {
        const languageId = $("#select-lang>select").val();
        if (languageId in languageIdMap) {
            languageName = languageIdMap[languageId];
            $("#atcoder-easy-test-language").css("color", "#fff").val(languageLabelMap[languageName]);
            $("#atcoder-easy-test-run").removeClass("disabled");
        } else {
            $("#atcoder-easy-test-language").css("color", "#f55").val("language not supported on paiza.io");
            $("#atcoder-easy-test-run").addClass("disabled");
        }
        console.log(languageId);
    }

    async function getJSON(method, url, data) {
        const params = Object.entries(data).map(([key, value]) =>
                                                encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&");
        const response = await fetch(url + "?" + params, {
            method,
            mode: "cors",
            headers: {
                "Accept": "application/json",
            },
        });
        return await response.json();
    }

    async function submitTest(input) {
        let id, status, error;
        try {
            const response = await getJSON("POST", "https://api.paiza.io/runners/create", {
                source_code: getSourceCode(),
                language: languageName,
                input,
                longpoll: true,
                longpoll_timeout: 10,
                api_key: "guest",
            });
            id = response.id;
            status = response.status;
            error = response.error;
        } catch (error) {
            status = "completed";
            return {
                status: "IE",
                exitCode: error,
            };
        }
        console.log("runner id: %s: %s", id, status);

        while (status != "completed") {
            let response = await getJSON("GET", "https://api.paiza.io/runners/get_status", {
                id,
                api_key: "guest",
            });
            console.log("%s: %s" ,id, status);
            status = response.status;
            error = response.error;
        }

        if (error) console.error("%s: %s", id, error);

        let {build_stderr, build_exit_code, build_result, stdout, stderr, exit_code, time, memory, result} = await getJSON("GET", "https://api.paiza.io/runners/get_details", {
            id,
            api_key: "guest",
        });

        console.info("%s: %s", id, result);

        if (build_exit_code != 0) {
            return {
                status: "CE",
                exitCode: build_exit_code,
                stderr: build_stderr,
            };
        }

        return {
            status: exit_code == 0 ? "OK" : result == "timeout" ? "TLE" : "RE",
            exitCode: exit_code,
            execTime: +time * 1e3,
            memory: memory * 1e-3,
            stdout,
            stderr,
        };
    }

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

        const result = await submitTest(input);

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
