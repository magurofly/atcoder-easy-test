// ==UserScript==
// @name        AtCoder Easy Test
// @namespace   https://atcoder.jp/
// @version     2.0.0
// @description Make testing sample cases easy
// @author      magurofly
// @license     MIT
// @supportURL  https://github.com/magurofly/atcoder-easy-test/
// @match       https://atcoder.jp/contests/*/tasks/*
// @grant       unsafeWindow
// ==/UserScript==
(function() {
function html2element(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstChild;
}

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
    label;
    site;
    constructor(label, site) {
        this.label = `${label} [${site}]`;
    }
    async test(sourceCode, input, supposedOutput, options) {
        const result = await this.run(sourceCode, input);
        if (result.status != "OK" || typeof supposedOutput != "string")
            return result;
        let output = result.stdout || "";
        if (options.trim) {
            supposedOutput = supposedOutput.trim();
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
                const xs = x.trim().split(/\s+/);
                const ys = y.trim().split(/\s+/);
                if (xs.length != ys.length)
                    return false;
                const len = x.length;
                for (let i = 0; i < len; i++) {
                    if (!superEquals(x[i], y[i]))
                        return false;
                }
                return true;
            };
        }
        result.status = equals(output, supposedOutput) ? "AC" : "WA";
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
                stdout: data.Stdout,
                stderr: data.Stderr,
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
                stderr: error,
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
        };
        if (res.build_result == "failure") {
            result.status = "CE";
            result.exitCode = res.build_exit_code;
            result.stdout = res.build_stdout;
            result.stderr = res.build_stderr;
        }
        else {
            result.status = (res.result == "timeout") ? "TLE" : (res.result == "failure") ? "RE" : "OK";
            result.exitCode = res.exit_code;
            result.stdout = res.stdout;
            result.stderr = res.stderr;
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
        return this.request(JSON.stringify(Object.assign({
            compiler: this.name,
            code: sourceCode,
            stdin: input,
        }, options)));
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
        }
        catch (error) {
            console.error(error);
            return {
                status: "IE",
                stderr: String(error),
            };
        }
        const endTime = Date.now();
        const result = {
            status: "OK",
            exitCode: String(res.status),
            execTime: endTime - startTime,
            stdout: String(res.program_output),
            stderr: String(res.program_error),
        };
        // 正常終了以外の場合
        if (res.status != 0) {
            if (res.signal) {
                result.exitCode += ` (${res.signal})`;
            }
            result.stdout = String(res.compiler_output || "") + String(result.stdout || "");
            result.stderr = String(res.compiler_error || "") + String(result.stderr || "");
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
        return await this.request(JSON.stringify(Object.assign({
            compiler: this.name,
            code: sourceCode,
            stdin: input,
            codes,
            "compiler-option-raw": "-I.",
        }, options)));
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
        stdout,
        stderr,
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
                stdout: sourceCode,
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
    run(languageId, index, sourceCode, input, supposedOutput, options = { trim: true, split: true }) {
        // CodeRunner が存在しない言語ID
        if (!(languageId in runners))
            return Promise.reject("Language not supported");
        if (!(index in runners[languageId]))
            return Promise.reject(`Runner index out of range: [0, ${runners[languageId].length})`);
        // 最後に実行したコードを保存
        codeSaver.save(sourceCode);
        // 実行
        return runners[languageId][index].test(sourceCode, input, supposedOutput, options);
    },
    // 環境の名前の一覧を取得する
    async getEnvironment(languageId) {
        if (!(languageId in runners))
            throw "language not supported";
        return runners[languageId].map((runner) => runner.label);
    },
};

const tabTemplate = html2element(hTabTemplate);
class ResultTabContent {
    _title;
    _uid;
    _element;
    constructor() {
        this._uid = Date.now().toString(16);
        this._element = tabTemplate.cloneNode(true);
        this._element.id = `atcoder-easy-test-result-${this._uid}`;
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
        this._get("col-input").classList.add("col-sm-6");
        this._get("col-expected-output").classList.remove("hidden");
    }
    get expectedOutputStyle() {
        return this._get("expected-output").style;
    }
    set output(output) {
        this._get("");
    }
    get outputStyle() {
        return this._get("output").style;
    }
    set error(error) {
        this._get("error").value = error;
        this._get("col-output").classList.add("col-md-6");
        this._get("col-error").classList.remove("hidden");
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

const style = html2element(hStyle);
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
    const onEnd = (event) => {
        resizeStart = null;
    };
    bottomMenuTabs.addEventListener("mousedown", onStart);
    bottomMenuTabs.addEventListener("mousemove", onMove);
    bottomMenuTabs.addEventListener("mouseup", onEnd);
    bottomMenuTabs.addEventListener("mouseleave", onEnd);
}
let tabs = new Set();
/** 下メニューの操作 */
const menuController = {
    /** 下メニューにタブを追加する */
    addTab(tabId, tabLabel, paneContent, options = {}) {
        console.log(`AtCoder Easy Test: addTab: ${tabLabel} (${tabId})`, paneContent);
        // タブを追加
        const tab = document.createElement("a");
        tab.id = `bottom-menu-tab-${tabId}`;
        tab.href = "#";
        tab.dataset.target = `#bottom-menu-pane-${tabId}`;
        tab.dataset.toggle = "tab";
        tab.addEventListener("click", event => {
            event.preventDefault();
            tab.tab("show"); // Bootstrap 3
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
            close() {
                bottomMenuTabs.removeChild(tabLi);
                bottomMenuContents.removeChild(pane);
                tabs.delete(tab);
                if (tabLi.classList.contains("active") && tabs.size > 0) {
                    tabs.values().next().value.tab("show");
                }
            },
            show() {
                menuController.show();
                tab.tab("show"); // Bootstrap 3
            },
            set color(color) {
                tab.style.backgroundColor = color;
            },
        };
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

const eAtCoderLang = unsafeWindow.document.querySelector("#select-lang>select");
const root = html2element(hRoot);
const E = (id) => root.querySelector(`#atcoder-easy-test-${id}`);
const eLanguage = E("language");
const eInput = E("input");
const eAllowableErrorCheck = E("allowable-error-check");
const eAllowableError = E("alloable-error");
const eOutput = E("output");
const eRun = E("run");
E("version").textContent = "2.0.0";
async function runTest(title, input, output = null) {
    const content = new ResultTabContent();
    content.input = input;
    if (output)
        content.expectedOutput = output;
    const tab = menuController.addTab("easy-test-result-" + content.uid, title, content.element, { active: true, closeButton: true });
    const options = { trim: true, split: true, };
    if (eAllowableErrorCheck.checked) {
        options.allowableError = parseFloat(eAllowableError.value);
    }
    const result = await codeRunner.run(eAtCoderLang.value, +eLanguage.value, unsafeWindow.getSourceCode(), input, output, options);
    if (result.status == "AC") {
        tab.color = "#dff0d8";
        content.outputStyle.backgroundColor = "#dff0d8";
    }
    else if (result.status != "OK") {
        tab.color = "#fcf8e3";
        content.outputStyle.backgroundColor = "#fcf8e3";
    }
    content.exitCode = result.exitCode;
    if ("execTime" in result)
        content.execTime = `${result.execTime} ms`;
    if ("memory" in result)
        content.memory = `${result.memory} KB`;
    if ("stdout" in result)
        content.output = result.stdout;
    if ("stderr" in result)
        content.error = result.stderr;
    return result;
}
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
        eRun.classList.remove("disabled");
        E("btn-test-all").classList.remove("disabled");
    }
    catch (error) {
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
menuController.addTab("easy-test", "Easy Test", root);
})();
