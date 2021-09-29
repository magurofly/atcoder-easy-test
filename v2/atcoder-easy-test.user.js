// ==UserScript==
// @name        AtCoder Easy Test v2
// @namespace   https://atcoder.jp/
// @version     2.0.1
// @description Make testing sample cases easy
// @author      magurofly
// @license     MIT
// @supportURL  https://github.com/magurofly/atcoder-easy-test/
// @match       https://atcoder.jp/contests/*/tasks/*
// @grant       unsafeWindow
// ==/UserScript==
(function() {
const codeSaver = {
    LIMIT: 10,
    get() {
        // `json` は、ソースコード文字列またはJSON文字列
        let json = unsafeWindow.localStorage.AtCoderEasyTest$lastCode;
        let data = [];
        try {
            if (typeof json == "string") {
                data.push(...JSON.parse(json));
            }
            else {
                data = [];
            }
        }
        catch (e) {
            data.push({
                path: unsafeWindow.localStorage.AtCoderEasyTset$lastPage,
                code: json,
            });
        }
        return data;
    },
    set(data) {
        unsafeWindow.localStorage.AtCoderEasyTest$lastCode = JSON.stringify(data);
    },
    save(code) {
        let data = codeSaver.get();
        const idx = data.findIndex(({ path }) => path == location.pathname);
        if (idx != -1)
            data.splice(idx, idx + 1);
        data.push({
            path: location.pathname,
            code,
        });
        while (data.length > codeSaver.LIMIT)
            data.shift();
        codeSaver.set(data);
    },
    restore() {
        const data = codeSaver.get();
        const idx = data.findIndex(({ path }) => path == location.pathname);
        if (idx == -1 || !(data[idx] instanceof Object))
            return Promise.reject(`No saved code found for ${location.pathname}`);
        return Promise.resolve(data[idx].code);
    }
};

class CodeRunner {
    get label() {
        return this._label;
    }
    constructor(label, site) {
        this._label = `${label} [${site}]`;
    }
    async test(sourceCode, input, expectedOutput, options) {
        const result = await this.run(sourceCode, input);
        if (expectedOutput != null)
            result.expectedOutput = expectedOutput;
        if (result.status != "OK" || typeof expectedOutput != "string")
            return result;
        let output = result.output || "";
        if (options.trim) {
            expectedOutput = expectedOutput.trim();
            output = output.trim();
        }
        let equals = (x, y) => x === y;
        if (options.allowableError) {
            const floatPattern = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
            const superEquals = equals;
            equals = (x, y) => {
                if (floatPattern.test(x) && floatPattern.test(y))
                    return Math.abs(parseFloat(x) - parseFloat(y)) <= options.allowableError;
                return superEquals(x, y);
            };
        }
        if (options.split) {
            const superEquals = equals;
            equals = (x, y) => {
                const xs = x.split(/\s+/);
                const ys = y.split(/\s+/);
                if (xs.length != ys.length)
                    return false;
                const len = xs.length;
                for (let i = 0; i < len; i++) {
                    if (!superEquals(xs[i], ys[i]))
                        return false;
                }
                return true;
            };
        }
        result.status = equals(output, expectedOutput) ? "AC" : "WA";
        return result;
    }
}

class CustomRunner extends CodeRunner {
    run;
    constructor(label, run) {
        super(label, "Browser");
        this.run = run;
    }
}

function buildParams(data) {
    return Object.entries(data).map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&");
}
function sleep(ms) {
    return new Promise(done => setTimeout(done, ms));
}

let waitAtCoderCustomTest = Promise.resolve();
const AtCoderCustomTestBase = location.href.replace(/\/tasks\/.+$/, "/custom_test");
const AtCoderCustomTestResultAPI = AtCoderCustomTestBase + "/json?reload=true";
const AtCoderCustomTestSubmitAPI = AtCoderCustomTestBase + "/submit/json";
class AtCoderRunner extends CodeRunner {
    languageId;
    constructor(languageId, label) {
        super(label, "AtCoder");
        this.languageId = languageId;
    }
    async run(sourceCode, input) {
        const promise = this.submit(sourceCode, input);
        waitAtCoderCustomTest = promise;
        return await promise;
    }
    async submit(sourceCode, input) {
        try {
            await waitAtCoderCustomTest;
        }
        catch (error) {
            console.error(error);
        }
        const error = await fetch(AtCoderCustomTestSubmitAPI, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: buildParams({
                "data.LanguageId": String(this.languageId),
                sourceCode,
                input,
                csrf_token: unsafeWindow.csrfToken,
            }),
        }).then(r => r.text());
        if (error) {
            throw new Error(error);
        }
        await sleep(100);
        for (;;) {
            const data = await fetch(AtCoderCustomTestResultAPI, {
                method: "GET",
                credentials: "include",
            }).then(r => r.json());
            if (!("Result" in data))
                continue;
            const result = data.Result;
            if ("Interval" in data) {
                await sleep(data.Interval);
                continue;
            }
            return {
                status: (result.ExitCode == 0) ? "OK" : (result.TimeConsumption == -1) ? "CE" : "RE",
                exitCode: result.ExitCode,
                execTime: result.TimeConsumption,
                memory: result.MemoryConsumption,
                input,
                output: data.Stdout,
                error: data.Stderr,
            };
        }
    }
}

class PaizaIORunner extends CodeRunner {
    name;
    constructor(name, label) {
        super(label, "PaizaIO");
        this.name = name;
    }
    async run(sourceCode, input) {
        let id, status, error;
        try {
            const res = await fetch("https://api.paiza.io/runners/create?" + buildParams({
                source_code: sourceCode,
                language: this.name,
                input,
                longpoll: "true",
                longpoll_timeout: "10",
                api_key: "guest",
            }), {
                method: "POST",
                mode: "cors",
            }).then(r => r.json());
            id = res.id;
            status = res.status;
            error = res.error;
        }
        catch (error) {
            return {
                status: "IE",
                input,
                error: String(error),
            };
        }
        while (status == "running") {
            const res = await fetch("https://api.paiza.io/runners/get_status?" + buildParams({
                id,
                api_key: "guest",
            }), {
                mode: "cors",
            }).then(res => res.json());
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
            status: "OK",
            exitCode: String(res.exit_code),
            execTime: +res.time * 1e3,
            memory: +res.memory * 1e-3,
            input,
        };
        if (res.build_result == "failure") {
            result.status = "CE";
            result.exitCode = res.build_exit_code;
            result.output = res.build_stdout;
            result.error = res.build_stderr;
        }
        else {
            result.status = (res.result == "timeout") ? "TLE" : (res.result == "failure") ? "RE" : "OK";
            result.exitCode = res.exit_code;
            result.output = res.stdout;
            result.error = res.stderr;
        }
        return result;
    }
}

class WandboxRunner extends CodeRunner {
    name;
    options;
    constructor(name, label, options = {}) {
        super(label, "Wandbox");
        this.name = name;
        this.options = options;
    }
    getOptions(sourceCode, input) {
        if (typeof this.options == "function")
            return this.options(sourceCode, input);
        return this.options;
    }
    run(sourceCode, input) {
        const options = this.getOptions(sourceCode, input);
        return this.request(Object.assign({
            compiler: this.name,
            code: sourceCode,
            stdin: input,
        }, options));
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
                body: JSON.stringify(body),
            }).then(r => r.json());
        }
        catch (error) {
            console.error(error);
            return {
                status: "IE",
                input: body.stdin,
                error: String(error),
            };
        }
        const endTime = Date.now();
        const result = {
            status: "OK",
            exitCode: String(res.status),
            execTime: endTime - startTime,
            input: body.stdin,
            output: String(res.program_output || ""),
            error: String(res.program_error || ""),
        };
        // 正常終了以外の場合
        if (res.status != 0) {
            if (res.signal) {
                result.exitCode += ` (${res.signal})`;
            }
            result.output = String(res.compiler_output || "") + String(result.output || "");
            result.error = String(res.compiler_error || "") + String(result.error || "");
            if (res.compiler_output || res.compiler_error) {
                result.status = "CE";
            }
            else {
                result.status = "RE";
            }
        }
        return result;
    }
}

class WandboxCppRunner extends WandboxRunner {
    async run(sourceCode, input) {
        // ACL を結合する
        const ACLBase = "https://cdn.jsdelivr.net/gh/atcoder/ac-library/";
        const files = new Map();
        const includeHeader = async (source) => {
            const pattern = /^#\s*include\s*[<"]atcoder\/([^>"]+)[>"]/gm;
            const loaded = [];
            let match;
            while (match = pattern.exec(source)) {
                const file = "atcoder/" + match[1];
                if (files.has(file))
                    continue;
                files.set(file, null);
                loaded.push([file, fetch(ACLBase + file, { mode: "cors", cache: "force-cache", }).then(r => r.text())]);
            }
            const included = await Promise.all(loaded.map(async ([file, r]) => {
                const source = await r;
                files.set(file, source);
                return source;
            }));
            for (const source of included) {
                await includeHeader(source);
            }
        };
        await includeHeader(sourceCode);
        const codes = [];
        for (const [file, code] of files) {
            codes.push({ file, code, });
        }
        const options = this.getOptions(sourceCode, input);
        return await this.request(Object.assign({
            compiler: this.name,
            code: sourceCode,
            stdin: input,
            codes,
            "compiler-option-raw": "-I.",
        }, options));
    }
}

let brythonRunnerLoaded = false;
const brythonRunner = new CustomRunner("Brython", async (sourceCode, input) => {
    if (!brythonRunnerLoaded) {
        // BrythonRunner を読み込む
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/gh/pythonpad/brython-runner/lib/brython-runner.bundle.js";
            script.onload = () => {
                brythonRunnerLoaded = true;
                resolve(null);
            };
            document.head.appendChild(script);
        });
    }
    let stdout = "";
    let stderr = "";
    let stdinOffset = 0;
    const BrythonRunner = unsafeWindow.BrythonRunner;
    const runner = new BrythonRunner({
        stdout: { write(content) { stdout += content; }, flush() { } },
        stderr: { write(content) { stderr += content; }, flush() { } },
        stdin: { async readline() {
                let index = input.indexOf("\n", stdinOffset) + 1;
                if (index == 0)
                    index = input.length;
                const text = input.slice(stdinOffset, index);
                stdinOffset = index;
                return text;
            } },
    });
    const timeStart = Date.now();
    await runner.runCode(sourceCode);
    const timeEnd = Date.now();
    return {
        status: "OK",
        exitCode: "0",
        execTime: (timeEnd - timeStart),
        input,
        output: stdout,
        error: stderr,
    };
});

const runners = {
    "4001": [new WandboxRunner("gcc-10.1.0-c", "C (GCC 10.1.0)")],
    "4002": [new PaizaIORunner("c", "C (C17 / Clang 10.0.0)")],
    "4003": [new WandboxCppRunner("gcc-10.1.0", "C++ (GCC 10.1.0)", { options: "warning,boost-1.73.0-gcc-9.2.0,gnu++17" })],
    "4004": [new WandboxCppRunner("clang-10.0.0", "C++ (Clang 10.0.0)", { options: "warning,boost-nothing-clang-10.0.0,c++17" })],
    "4006": [
        new PaizaIORunner("python3", "Python (3.8.2)"),
        brythonRunner,
    ],
    "4007": [new PaizaIORunner("bash", "Bash (5.0.17)")],
    "4010": [new WandboxRunner("csharp", "C# (.NET Core 6.0.100-alpha.1.20562.2)")],
    "4011": [new WandboxRunner("mono-head", "C# (Mono-mcs 5.19.0.0)")],
    "4013": [new PaizaIORunner("clojure", "Clojure (1.10.1-1)")],
    "4017": [new PaizaIORunner("d", "D (LDC 1.23.0)")],
    "4020": [new PaizaIORunner("erlang", "Erlang (10.6.4)")],
    "4021": [new PaizaIORunner("elixir", "Elixir (1.10.4)")],
    "4022": [new PaizaIORunner("fsharp", "F# (Interactive 4.0)")],
    "4023": [new PaizaIORunner("fsharp", "F# (Interactive 4.0)")],
    "4026": [new WandboxRunner("go-1.14.1", "Go (1.14.1)")],
    "4027": [new WandboxRunner("ghc-head", "Haskell (GHC 8.7.20181121)")],
    "4030": [new PaizaIORunner("javascript", "JavaScript (Node.js 12.18.3)")],
    "4032": [new PaizaIORunner("kotlin", "Kotlin (1.4.0)")],
    "4033": [new WandboxRunner("lua-5.3.4", "Lua (Lua 5.3.4)")],
    "4034": [new WandboxRunner("luajit-head", "Lua (LuaJIT 2.1.0-beta3)")],
    "4036": [new WandboxRunner("nim-1.0.6", "Nim (1.0.6)")],
    "4037": [new PaizaIORunner("objective-c", "Objective-C (Clang 10.0.0)")],
    "4039": [new WandboxRunner("ocaml-head", "OCaml (4.13.0+dev0-2020-10-19)")],
    "4041": [new WandboxRunner("fpc-3.0.2", "Pascal (FPC 3.0.2)")],
    "4042": [new PaizaIORunner("perl", "Perl (5.30.0)")],
    "4044": [
        new PaizaIORunner("php", "PHP (7.4.10)"),
        new WandboxRunner("php-7.3.3", "PHP (7.3.3)"),
    ],
    "4046": [new WandboxRunner("pypy-head", "PyPy2 (7.3.4-alpha0)")],
    "4047": [new WandboxRunner("pypy-7.2.0-3", "PyPy3 (7.2.0)")],
    "4049": [
        new PaizaIORunner("ruby", "Ruby (2.7.1)"),
        new WandboxRunner("ruby-head", "Ruby (HEAD 3.0.0dev)"),
        new WandboxRunner("ruby-2.7.0-preview1", "Ruby (2.7.0-preview1)"),
    ],
    "4050": [
        new AtCoderRunner("4050", "Rust (1.42.0)"),
        new WandboxRunner("rust-head", "Rust (1.37.0-dev)"),
        new PaizaIORunner("rust", "Rust (1.43.0)"),
    ],
    "4051": [new PaizaIORunner("scala", "Scala (2.13.3)")],
    "4053": [new PaizaIORunner("scheme", "Scheme (Gauche 0.9.6)")],
    "4055": [new PaizaIORunner("swift", "Swift (5.2.5)")],
    "4056": [new CustomRunner("Text", async (sourceCode, input) => {
            return {
                status: "OK",
                exitCode: "0",
                input,
                output: sourceCode,
            };
        })],
    "4058": [new PaizaIORunner("vb", "Visual Basic (.NET Core 4.0.1)")],
    "4061": [new PaizaIORunner("cobol", "COBOL - Free (OpenCOBOL 2.2.0)")],
    "4101": [new WandboxCppRunner("gcc-9.2.0", "C++ (GCC 9.2.0)")],
    "4102": [new WandboxCppRunner("clang-10.0.0", "C++ (Clang 10.0.0)")],
};
for (const e of document.querySelectorAll("#select-lang option[value]")) {
    const languageId = e.value;
    // 特別な CodeRunner が定義されていない言語ID
    if (!(languageId in runners))
        runners[languageId] = [];
    // AtCoderRunner がない場合は、追加する
    if (runners[languageId].some((runner) => runner instanceof AtCoderRunner))
        continue;
    runners[languageId].push(new AtCoderRunner(languageId, e.textContent));
}
console.info("AtCoder Easy Test: codeRunner OK");
var codeRunner = {
    // 指定した環境でコードを実行する
    run(languageId, index, sourceCode, input, expectedOutput, options = { trim: true, split: true }) {
        // CodeRunner が存在しない言語ID
        if (!(languageId in runners))
            return Promise.reject("Language not supported");
        if (!(index in runners[languageId]))
            return Promise.reject(`Runner index out of range: [0, ${runners[languageId].length})`);
        // 最後に実行したコードを保存
        codeSaver.save(sourceCode);
        // 実行
        return runners[languageId][index].test(sourceCode, input, expectedOutput, options);
    },
    // 環境の名前の一覧を取得する
    async getEnvironment(languageId) {
        if (!(languageId in runners))
            throw "language not supported";
        return runners[languageId].map((runner) => runner.label);
    },
};

function getTestCases() {
    const selectors = [
        ["#task-statement p+pre.literal-block", ".section"],
        ["#task-statement pre.source-code-for-copy", ".part"],
        ["#task-statement .lang>*:nth-child(1) .div-btn-copy+pre", ".part"],
        ["#task-statement .div-btn-copy+pre", ".part"],
        ["#task-statement>.part pre.linenums", ".part"],
        ["#task-statement>.part:not(.io-style)>h3+section>pre", ".part"],
        ["#task-statement pre", ".part"],
    ];
    for (const [selector, closestSelector] of selectors) {
        const e = [...document.querySelectorAll(selector)].filter(e => {
            if (e.closest(".io-style"))
                return false; // practice2
            return true;
        });
        if (e.length == 0)
            continue;
        const testcases = [];
        let sampleId = 1;
        for (let i = 0; i < e.length; i += 2) {
            const container = e[i].closest(closestSelector) || e[i].parentElement;
            testcases.push({
                title: `Sample ${sampleId++}`,
                input: (e[i] || {}).textContent,
                output: (e[i + 1] || {}).textContent,
                anchor: container.querySelector("h3"),
            });
        }
        return testcases;
    }
    return [];
}

function html2element(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstChild;
}
const eventListeners = {};
const events = {
    on(name, listener) {
        const listeners = (name in eventListeners ? eventListeners[name] : eventListeners[name] = []);
        listeners.push(listener);
    },
    trig(name) {
        if (name in eventListeners) {
            for (const listener of eventListeners[name])
                listener();
        }
    },
};

var hBottomMenu = "<div id=\"bottom-menu-wrapper\" class=\"navbar navbar-default navbar-fixed-bottom\">\n  <div class=\"container\">\n    <div class=\"navbar-header\">\n      <button id=\"bottom-menu-key\" type=\"button\" class=\"navbar-toggle collapsed glyphicon glyphicon-menu-down\" data-toggle=\"collapse\" data-target=\"#bottom-menu\"></button>\n    </div>\n    <div id=\"bottom-menu\" class=\"collapse navbar-collapse\">\n      <ul id=\"bottom-menu-tabs\" class=\"nav nav-tabs\"></ul>\n      <div id=\"bottom-menu-contents\" class=\"tab-content\"></div>\n    </div>\n  </div>\n</div>";

var hStyle$1 = "<style>\n#bottom-menu-wrapper {\n  background: transparent;\n  border: none;\n  pointer-events: none;\n  padding: 0;\n}\n\n#bottom-menu-wrapper>.container {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  padding: 0;\n}\n\n#bottom-menu-wrapper>.container>.navbar-header {\n  float: none;\n}\n\n#bottom-menu-key {\n  display: block;\n  float: none;\n  margin: 0 auto;\n  padding: 10px 3em;\n  border-radius: 5px 5px 0 0;\n  background: #000;\n  opacity: 0.5;\n  color: #FFF;\n  cursor: pointer;\n  pointer-events: auto;\n  text-align: center;\n}\n\n@media screen and (max-width: 767px) {\n  #bottom-menu-key {\n    opacity: 0.25;\n  }\n}\n\n#bottom-menu-key.collapsed:before {\n  content: \"\\e260\";\n}\n\n#bottom-menu-tabs {\n  padding: 3px 0 0 10px;\n  cursor: n-resize;\n}\n\n#bottom-menu-tabs a {\n  pointer-events: auto;\n}\n\n#bottom-menu {\n  pointer-events: auto;\n  background: rgba(0, 0, 0, 0.8);\n  color: #fff;\n  max-height: unset;\n}\n\n#bottom-menu.collapse:not(.in) {\n  display: none !important;\n}\n\n#bottom-menu-tabs>li>a {\n  background: rgba(150, 150, 150, 0.5);\n  color: #000;\n  border: solid 1px #ccc;\n  filter: brightness(0.75);\n}\n\n#bottom-menu-tabs>li>a:hover {\n  background: rgba(150, 150, 150, 0.5);\n  border: solid 1px #ccc;\n  color: #111;\n  filter: brightness(0.9);\n}\n\n#bottom-menu-tabs>li.active>a {\n  background: #eee;\n  border: solid 1px #ccc;\n  color: #333;\n  filter: none;\n}\n\n.bottom-menu-btn-close {\n  font-size: 8pt;\n  vertical-align: baseline;\n  padding: 0 0 0 6px;\n  margin-right: -6px;\n}\n\n#bottom-menu-contents {\n  padding: 5px 15px;\n  max-height: 50vh;\n  overflow-y: auto;\n}\n\n#bottom-menu-contents .panel {\n  color: #333;\n}\n</style>";

const style = html2element(hStyle$1);
const bottomMenu = html2element(hBottomMenu);
unsafeWindow.document.head.appendChild(style);
unsafeWindow.document.getElementById("main-div").appendChild(bottomMenu);
const bottomMenuKey = bottomMenu.querySelector("#bottom-menu-key");
const bottomMenuTabs = bottomMenu.querySelector("#bottom-menu-tabs");
const bottomMenuContents = bottomMenu.querySelector("#bottom-menu-contents");
// メニューのリサイズ
{
    let resizeStart = null;
    const onStart = (event) => {
        const target = event.target;
        const pageY = event.pageY;
        if (target.id != "bottom-menu-tabs")
            return;
        resizeStart = { y: pageY, height: bottomMenuContents.getBoundingClientRect().height };
    };
    const onMove = (event) => {
        if (!resizeStart)
            return;
        event.preventDefault();
        bottomMenuContents.style.height = `${resizeStart.height - (event.pageY - resizeStart.y)}px`;
    };
    const onEnd = () => {
        resizeStart = null;
    };
    bottomMenuTabs.addEventListener("mousedown", onStart);
    bottomMenuTabs.addEventListener("mousemove", onMove);
    bottomMenuTabs.addEventListener("mouseup", onEnd);
    bottomMenuTabs.addEventListener("mouseleave", onEnd);
}
let tabs = new Set();
let selectedTab = null;
/** 下メニューの操作 */
const menuController = {
    /** タブを選択 */
    selectTab(tabId) {
        const tab = unsafeWindow.$(`#bottom-menu-tab-${tabId}`);
        if (tab && tab[0]) {
            tab.tab("show"); // Bootstrap 3
            selectedTab = tabId;
        }
    },
    /** 下メニューにタブを追加する */
    addTab(tabId, tabLabel, paneContent, options = {}) {
        console.log(`AtCoder Easy Test: addTab: ${tabLabel} (${tabId})`, paneContent);
        // タブを追加
        const tab = document.createElement("a");
        tab.textContent = tabLabel;
        tab.id = `bottom-menu-tab-${tabId}`;
        tab.href = "#";
        tab.dataset.target = `#bottom-menu-pane-${tabId}`;
        tab.dataset.toggle = "tab";
        tab.addEventListener("click", event => {
            event.preventDefault();
            menuController.selectTab(tabId);
        });
        const tabLi = document.createElement("li");
        tabLi.appendChild(tab);
        bottomMenuTabs.appendChild(tabLi);
        // 内容を追加
        const pane = document.createElement("div");
        pane.className = "tab-pane";
        pane.id = `bottom-menu-pane-${tabId}`;
        pane.appendChild(paneContent);
        bottomMenuContents.appendChild(pane);
        const controller = {
            get id() {
                return tabId;
            },
            close() {
                bottomMenuTabs.removeChild(tabLi);
                bottomMenuContents.removeChild(pane);
                tabs.delete(tab);
                if (selectedTab == tabId) {
                    selectedTab = null;
                    if (tabs.size > 0) {
                        menuController.selectTab(tabs.values().next().value.id);
                    }
                }
            },
            show() {
                menuController.show();
                menuController.selectTab(tabId);
            },
            set color(color) {
                tab.style.backgroundColor = color;
            },
        };
        // 選択されているタブがなければ選択
        if (!selectedTab)
            menuController.selectTab(tabId);
        return controller;
    },
    /** 下メニューを表示する */
    show() {
        if (bottomMenuKey.classList.contains("collapsed"))
            bottomMenuKey.click();
    },
    /** 下メニューの表示/非表示を切り替える */
    toggle() {
        bottomMenuKey.click();
    },
};
console.info("AtCoder Easy Test: bottomMenu OK");

var hRowTemplate = "<div class=\"atcoder-easy-test-cases-row alert alert-dismissible\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"close\">\n    <span aria-hidden=\"true\">×</span>\n  </button>\n  <div class=\"progress\">\n    <div class=\"progress-bar\" style=\"width: 0%;\">0 / 0</div>\n  </div>\n  <!--div class=\"label label-default label-warning\" style=\"margin: 3px; cursor: pointer;\">WA</div>\n  <div class=\"label label-default label-warning\" style=\"margin: 3px; cursor: pointer;\">WA</div>\n  <div class=\"label label-default label-warning\" style=\"margin: 3px; cursor: pointer;\">WA</div-->\n</div>";

class ResultRow {
    _tabs;
    _element;
    _promise;
    constructor(pairs) {
        this._tabs = pairs.map(([_, tab]) => tab);
        this._element = html2element(hRowTemplate);
        const numCases = pairs.length;
        let numFinished = 0;
        let numAccepted = 0;
        const progressBar = this._element.querySelector(".progress-bar");
        progressBar.textContent = `${numFinished} / ${numCases}`;
        this._promise = Promise.all(pairs.map(([pResult, tab]) => {
            const button = html2element(`<div class="label label-default" style="margin: 3px; cursor: pointer;">WJ</div>`);
            button.addEventListener("click", () => {
                tab.show();
            });
            this._element.appendChild(button);
            return pResult.then(result => {
                button.textContent = result.status;
                if (result.status == "AC") {
                    button.classList.add("label-success");
                }
                else if (result.status != "OK") {
                    button.classList.add("label-warning");
                }
                numFinished++;
                if (result.status == "AC")
                    numAccepted++;
                progressBar.textContent = `${numFinished} / ${numCases}`;
                progressBar.style.width = `${100 * numFinished / numCases}%`;
                if (numFinished == numCases) {
                    if (numAccepted == numCases)
                        this._element.classList.add("alert-success");
                    else
                        this._element.classList.add("alert-warning");
                }
            }).catch(reason => {
                button.textContent = "IE";
                button.classList.add("label-danger");
                console.error(reason);
            });
        }));
    }
    get element() {
        return this._element;
    }
    onFinish(listener) {
        this._promise.then(listener);
    }
    remove() {
        for (const tab of this._tabs)
            tab.close();
        const parent = this._element.parentElement;
        if (parent)
            parent.removeChild(this._element);
    }
}

var hResultList = "<div class=\"row\"></div>";

const eResultList = html2element(hResultList);
unsafeWindow.document.querySelector(".form-code-submit").appendChild(eResultList);
const resultList = {
    addResult(pairs) {
        const result = new ResultRow(pairs);
        eResultList.appendChild(result.element);
        return result;
    },
};

var hTabTemplate = "<div class=\"atcoder-easy-test-result container\">\n  <div class=\"row\">\n    <div class=\"atcoder-easy-test-result-col-input col-xs-12\" data-if-expected-output=\"col-sm-6 col-sm-push-6\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Standard Input\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-input form-control\" rows=\"3\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n    <div class=\"atcoder-easy-test-result-col-expected-output col-xs-12 col-sm-6 hidden\" data-if-expected-output=\"!hidden col-sm-pull-6\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Expected Output\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-expected-output form-control\" rows=\"3\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n  </div>\n  <div class=\"row\"><div class=\"col-sm-6 col-sm-offset-3\">\n    <div class=\"panel panel-default\">\n      <table class=\"table table-condensed\">\n        <tbody>\n          <tr>\n            <th class=\"text-center\">Exit Code</th>\n            <th class=\"text-center\">Exec Time</th>\n            <th class=\"text-center\">Memory</th>\n          </tr>\n          <tr>\n            <td class=\"atcoder-easy-test-result-exit-code text-center\"></td>\n            <td class=\"atcoder-easy-test-result-exec-time text-center\"></td>\n            <td class=\"atcoder-easy-test-result-memory text-center\"></td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div></div>\n  <div class=\"row\">\n    <div class=\"atcoder-easy-test-result-col-output col-xs-12\" data-if-error=\"col-md-6\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Standard Output\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-output form-control\" rows=\"5\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n    <div class=\"atcoder-easy-test-result-col-error col-xs-12 col-md-6 hidden\" data-if-error=\"!hidden\">\n      <div class=\"form-group\">\n        <label class=\"control-label col-xs-12\">\n          Standard Error\n          <div class=\"col-xs-12\">\n            <textarea class=\"atcoder-easy-test-result-error form-control\" rows=\"5\" readonly=\"readonly\"></textarea>\n          </div>\n        </label>\n      </div>\n    </div>\n  </div>\n</div>";

function setClassFromData(element, name) {
    const classes = element.dataset[name].split(/\s+/);
    for (let className of classes) {
        let flag = true;
        if (className[0] == "!") {
            className = className.slice(1);
            flag = false;
        }
        element.classList.toggle(className, flag);
    }
}
class ResultTabContent {
    _title;
    _uid;
    _element;
    _result;
    constructor() {
        this._uid = Date.now().toString(16);
        this._result = null;
        this._element = html2element(hTabTemplate);
        this._element.id = `atcoder-easy-test-result-${this._uid}`;
    }
    set result(result) {
        this._result = result;
        if (result.status == "AC") {
            this.outputStyle.backgroundColor = "#dff0d8";
        }
        else if (result.status != "OK") {
            this.outputStyle.backgroundColor = "#fcf8e3";
        }
        this.input = result.input;
        if ("expectedOutput" in result)
            this.expectedOutput = result.expectedOutput;
        this.exitCode = result.exitCode;
        if ("execTime" in result)
            this.execTime = `${result.execTime} ms`;
        if ("memory" in result)
            this.memory = `${result.memory} KB`;
        if ("output" in result)
            this.output = result.output;
        if (result.error)
            this.error = result.error;
    }
    get result() {
        return this._result;
    }
    get uid() {
        return this._uid;
    }
    get element() {
        return this._element;
    }
    set title(title) {
        this._title = title;
    }
    get title() {
        return this._title;
    }
    set input(input) {
        this._get("input").value = input;
    }
    get inputStyle() {
        return this._get("input").style;
    }
    set expectedOutput(output) {
        this._get("expected-output").value = output;
        setClassFromData(this._get("col-input"), "ifExpectedOutput");
        setClassFromData(this._get("col-expected-output"), "ifExpectedOutput");
    }
    get expectedOutputStyle() {
        return this._get("expected-output").style;
    }
    set output(output) {
        this._get("output").value = output;
    }
    get outputStyle() {
        return this._get("output").style;
    }
    set error(error) {
        this._get("error").value = error;
        setClassFromData(this._get("col-output"), "ifError");
        setClassFromData(this._get("col-error"), "ifError");
    }
    set exitCode(code) {
        const element = this._get("exit-code");
        element.textContent = code;
        const isSuccess = code == "0";
        element.classList.toggle("bg-success", isSuccess);
        element.classList.toggle("bg-danger", !isSuccess);
    }
    set execTime(time) {
        this._get("exec-time").textContent = time;
    }
    set memory(memory) {
        this._get("memory").textContent = memory;
    }
    _get(name) {
        return this._element.querySelector(`.atcoder-easy-test-result-${name}`);
    }
}

var hRoot = "<form id=\"atcoder-easy-test-container\" class=\"form-horizontal\">\n  <small style=\"position: absolute; display: block; bottom: 0; right: 0; padding: 1% 4%; width: 95%; text-align: right;\">AtCoder Easy Test v<span id=\"atcoder-easy-test-version\"></span></small>\n  <div class=\"row\">\n      <div class=\"col-xs-12 col-lg-8\">\n          <div class=\"form-group\">\n              <label class=\"control-label col-sm-2\">Test Environment</label>\n              <div class=\"col-sm-10\">\n                  <select class=\"form-control\" id=\"atcoder-easy-test-language\"></select>\n              </div>\n          </div>\n          <div class=\"form-group\">\n              <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-input\">Standard Input</label>\n              <div class=\"col-sm-10\">\n                  <textarea id=\"atcoder-easy-test-input\" name=\"input\" class=\"form-control\" rows=\"3\"></textarea>\n              </div>\n          </div>\n      </div>\n      <div class=\"col-xs-12 col-lg-4\">\n          <details close>\n              <summary>Expected Output</summary>\n              <div class=\"form-group\">\n                  <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-allowable-error-check\">Allowable Error</label>\n                  <div class=\"col-sm-10\">\n                      <div class=\"input-group\">\n                          <span class=\"input-group-addon\">\n                              <input id=\"atcoder-easy-test-allowable-error-check\" type=\"checkbox\" checked=\"checked\">\n                          </span>\n                          <input id=\"atcoder-easy-test-allowable-error\" type=\"text\" class=\"form-control\" value=\"1e-6\">\n                      </div>\n                  </div>\n              </div>\n              <div class=\"form-group\">\n                  <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-output\">Expected Output</label>\n                  <div class=\"col-sm-10\">\n                      <textarea id=\"atcoder-easy-test-output\" name=\"output\" class=\"form-control\" rows=\"3\"></textarea>\n                  </div>\n              </div>\n          </details>\n      </div>\n      <div class=\"col-xs-12\">\n          <div class=\"col-xs-11 col-xs-offset=1\">\n              <div class=\"form-group\">\n                  <a id=\"atcoder-easy-test-run\" class=\"btn btn-primary\">Run</a>\n              </div>\n          </div>\n      </div>\n  </div>\n  <style>\n  #atcoder-easy-test-language {\n      border: none;\n      background: transparent;\n      font: inherit;\n      color: #fff;\n  }\n  #atcoder-easy-test-language option {\n      border: none;\n      color: #333;\n      font: inherit;\n  }\n  </style>\n</form>";

var hStyle = "<style>\n.atcoder-easy-test-result textarea {\n  font-family: monospace;\n  font-weight: normal;\n}\n</style>";

var hTestAndSubmit = "<a id=\"atcoder-easy-test-btn-test-and-submit\" class=\"btn btn-info btn\" style=\"margin-left: 1rem\" title=\"Ctrl+Enter\" data-toggle=\"tooltip\">Test &amp; Submit</a>";

var hTestAllSamples = "<a id=\"atcoder-easy-test-btn-test-all\" class=\"btn btn-default btn-sm\" style=\"margin-left: 1rem\" title=\"Alt+Enter\" data-toggle=\"tooltip\">Test All Samples</a>";

const doc = unsafeWindow.document;
const $ = unsafeWindow.$;
const $select = (selector) => doc.querySelector(selector);
// external interfaces
unsafeWindow.bottomMenu = menuController;
unsafeWindow.codeRunner = codeRunner;
doc.head.appendChild(html2element(hStyle));
// place "Easy Test" tab
{
    const eAtCoderLang = $select("#select-lang>select");
    const eSubmitButton = doc.getElementById("submit");
    // declare const hRoot: string;
    const root = html2element(hRoot);
    const E = (id) => root.querySelector(`#atcoder-easy-test-${id}`);
    const eLanguage = E("language");
    const eInput = E("input");
    const eAllowableErrorCheck = E("allowable-error-check");
    const eAllowableError = E("allowable-error");
    const eOutput = E("output");
    const eRun = E("run");
    E("version").textContent = "2.0.1";
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
            while (eLanguage.firstChild)
                eLanguage.removeChild(eLanguage.firstChild);
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
            }
            catch (error) {
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
    function runTest(title, input, output = null) {
        runId++;
        events.trig("disable");
        const options = { trim: true, split: true, };
        if (eAllowableErrorCheck.checked) {
            options.allowableError = parseFloat(eAllowableError.value);
        }
        const content = new ResultTabContent();
        const tab = menuController.addTab("easy-test-result-" + content.uid, `#${runId} ${title}`, content.element, { active: true, closeButton: true });
        const pResult = codeRunner.run(eAtCoderLang.value, +eLanguage.value, unsafeWindow.getSourceCode(), input, output, options);
        pResult.then(result => {
            content.result = result;
            if (result.status == "AC") {
                tab.color = "#dff0d8";
            }
            else if (result.status != "OK") {
                tab.color = "#fcf8e3";
            }
            events.trig("enable");
        });
        return [pResult, tab];
    }
    function runAllCases(testcases) {
        const pairs = testcases.map(testcase => runTest(testcase.title, testcase.input, testcase.output));
        resultList.addResult(pairs);
        return Promise.all(pairs.map(([pResult, _]) => pResult.then(result => {
            if (result.status == "AC")
                return Promise.resolve(result);
            else
                return Promise.reject(result);
        })));
    }
    eRun.addEventListener("click", _ => {
        const title = "Run";
        const input = eInput.value;
        const output = eOutput.value;
        runTest(title, input, output || null);
    });
    menuController.addTab("easy-test", "Easy Test", root);
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
                $select(".plain-textarea").value = lastCode;
                $(".editor").data("editor").doc.setValue(lastCode);
            }
        }
        catch (reason) {
            alert(reason);
        }
    });
    $select(".editor-buttons").appendChild(restoreButton);
}
catch (e) {
    console.error(e);
}
})();
