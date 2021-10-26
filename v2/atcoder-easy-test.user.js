// ==UserScript==
// @name        AtCoder Easy Test v2
// @namespace   https://atcoder.jp/
// @version     2.7.1
// @description Make testing sample cases easy
// @author      magurofly
// @license     MIT
// @supportURL  https://github.com/magurofly/atcoder-easy-test/
// @match       https://atcoder.jp/contests/*/tasks/*
// @match       https://yukicoder.me/problems/no/*
// @match       http://codeforces.com/contest/*/problem/*
// @match       http://codeforces.com/gym/*/problem/*
// @match       http://codeforces.com/problemset/problem/*
// @match       http://codeforces.com/group/*/contest/*/problem/*
// @match       http://*.contest.codeforces.com/group/*/contest/*/problem/*
// @match       https://codeforces.com/contest/*/problem/*
// @match       https://codeforces.com/gym/*/problem/*
// @match       https://codeforces.com/problemset/problem/*
// @match       https://codeforces.com/group/*/contest/*/problem/*
// @match       https://*.contest.codeforces.com/group/*/contest/*/problem/*
// @match       https://greasyfork.org/*/scripts/433152-atcoder-easy-test-v2
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
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

function similarLangs(targetLang, candidateLangs) {
    const [targetName, targetDetail] = targetLang.split(" ", 2);
    const selectedLangs = candidateLangs.filter(candidateLang => {
        const [name, _] = candidateLang.split(" ", 2);
        return name == targetName;
    }).map(candidateLang => {
        const [_, detail] = candidateLang.split(" ", 2);
        return [candidateLang, similarity(detail, targetDetail)];
    });
    return selectedLangs.sort((a, b) => a[1] - b[1]).map(([lang, _]) => lang);
}
function similarity(s, t) {
    const n = s.length, m = t.length;
    let dp = new Array(m + 1).fill(0);
    for (let i = 0; i < n; i++) {
        const dp2 = new Array(m + 1).fill(0);
        for (let j = 0; j < m; j++) {
            const cost = (s.charCodeAt(i) - t.charCodeAt(j)) ** 2;
            dp2[j + 1] = Math.min(dp[j] + cost, dp[j + 1] + cost * 0.25, dp2[j] + cost * 0.25);
        }
        dp = dp2;
    }
    return dp[m];
}

class CodeRunner {
    get label() {
        return this._label;
    }
    constructor(label, site) {
        this._label = `${label} [${site}]`;
    }
    async test(sourceCode, input, expectedOutput, options) {
        let result = { status: "IE", input };
        try {
            result = await this.run(sourceCode, input);
        }
        catch (e) {
            result.error = e.toString();
            return result;
        }
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
function doneOrFail(p) {
    return p.then(() => Promise.resolve(), () => Promise.resolve());
}
function html2element(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstChild;
}
function newElement(tagName, attrs = {}) {
    const e = document.createElement(tagName);
    for (const [key, value] of Object.entries(attrs)) {
        e[key] = value;
    }
    return e;
}
async function loadScript(src, ctx = null, env = {}) {
    const js = await fetch(src).then(res => res.text());
    const keys = [];
    const values = [];
    for (const [key, value] of Object.entries(env)) {
        keys.push(key);
        values.push(value);
    }
    unsafeWindow["Function"](keys.join(), js).apply(ctx, values);
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
class ObservableValue {
    _value;
    _listeners;
    constructor(value) {
        this._value = value;
        this._listeners = new Set();
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        for (const listener of this._listeners)
            listener(value);
    }
    addListener(listener) {
        this._listeners.add(listener);
        listener(this._value);
    }
    removeListener(listener) {
        this._listeners.delete(listener);
    }
    map(f) {
        const y = new ObservableValue(f(this.value));
        this.addListener(x => {
            y.value = f(x);
        });
        return y;
    }
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

async function loadPyodide() {
    const script = await fetch("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js").then(res => res.text());
    unsafeWindow["Function"](script)();
    const pyodide = await unsafeWindow["loadPyodide"]({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
    });
    await pyodide.runPythonAsync(`
import contextlib, io, platform
class __redirect_stdin(contextlib._RedirectStream):
  _stream = "stdin"
`);
    return pyodide;
}
let _pyodide = Promise.reject();
let _serial = Promise.resolve();
const pyodideRunner = new CustomRunner("Pyodide", (sourceCode, input) => new Promise((resolve, reject) => {
    _serial = _serial.finally(async () => {
        const pyodide = await (_pyodide = _pyodide.catch(loadPyodide));
        const code = `
def __run():
 global __stdout, __stderr, __stdin
 with __redirect_stdin(io.StringIO(__stdin)):
  with contextlib.redirect_stdout(io.StringIO()) as __stdout:
   with contextlib.redirect_stderr(io.StringIO()) as __stderr:
` + sourceCode.split("\n").map(line => "    " + line).join("\n");
        let status = "OK";
        let exitCode = "0";
        let stdout = "";
        let stderr = "";
        let startTime = -Infinity;
        let endTime = Infinity;
        pyodide.globals.__stdin = input;
        try {
            await pyodide.loadPackagesFromImports(code);
            await pyodide.runPythonAsync(code);
            startTime = Date.now();
            pyodide.runPython("__run()");
            endTime = Date.now();
            stdout += pyodide.globals.__stdout.getvalue();
            stderr += pyodide.globals.__stderr.getvalue();
        }
        catch (error) {
            status = "RE";
            exitCode = "-1";
            stderr += error.toString();
        }
        resolve({
            status,
            exitCode,
            execTime: (endTime - startTime),
            input,
            output: stdout,
            error: stderr,
        });
    });
}));

function pairs(list) {
    const pairs = [];
    const len = list.length >> 1;
    for (let i = 0; i < len; i++)
        pairs.push([list[i * 2], list[i * 2 + 1]]);
    return pairs;
}
async function init$4() {
    if (location.host != "atcoder.jp")
        throw "Not AtCoder";
    const doc = unsafeWindow.document;
    const eLanguage = unsafeWindow.$("#select-lang>select");
    const langMap = {
        4001: "C GCC 9.2.1",
        4002: "C Clang 10.0.0",
        4003: "C++ GCC 9.2.1",
        4004: "C++ Clang 10.0.0",
        4005: "Java OpenJDK 11.0.6",
        4006: "Python3 CPython 3.8.2",
        4007: "Bash 5.0.11",
        4008: "bc 1.07.1",
        4009: "Awk GNU Awk 4.1.4",
        4010: "C# .NET Core 3.1.201",
        4011: "C# Mono-mcs 6.8.0.105",
        4012: "C# Mono-csc 3.5.0",
        4013: "Clojure 1.10.1.536",
        4014: "Crystal 0.33.0",
        4015: "D DMD 2.091.0",
        4016: "D GDC 9.2.1",
        4017: "D LDC 1.20.1",
        4018: "Dart 2.7.2",
        4019: "dc 1.4.1",
        4020: "Erlang 22.3",
        4021: "Elixir 1.10.2",
        4022: "F# .NET Core 3.1.201",
        4023: "F# Mono 10.2.3",
        4024: "Forth gforth 0.7.3",
        4025: "Fortran GNU Fortran 9.2.1",
        4026: "Go 1.14.1",
        4027: "Haskell GHC 8.8.3",
        4028: "Haxe 4.0.3",
        4029: "Haxe 4.0.3",
        4030: "JavaScript Node.js 12.16.1",
        4031: "Julia 1.4.0",
        4032: "Kotlin 1.3.71",
        4033: "Lua Lua 5.3.5",
        4034: "Lua LuaJIT 2.1.0",
        4035: "Dash 0.5.8",
        4036: "Nim 1.0.6",
        4037: "Objective-C Clang 10.0.0",
        4038: "Lisp SBCL 2.0.3",
        4039: "OCaml 4.10.0",
        4040: "Octave 5.2.0",
        4041: "Pascal FPC 3.0.4",
        4042: "Perl 5.26.1",
        4043: "Raku Rakudo 2020.02.1",
        4044: "PHP 7.4.4",
        4045: "Prolog SWI-Prolog 8.0.3",
        4046: "Python PyPy2 7.3.0",
        4047: "Python3 PyPy3 7.3.0",
        4048: "Racket 7.6",
        4049: "Ruby 2.7.1",
        4050: "Rust 1.42.0",
        4051: "Scala 2.13.1",
        4052: "Java OpenJDK 1.8.0",
        4053: "Scheme Gauche 0.9.9",
        4054: "ML MLton 20130715",
        4055: "Swift 5.2.1",
        4056: "Text cat 8.28",
        4057: "TypeScript 3.8",
        4058: "Basic .NET Core 3.1.101",
        4059: "Zsh 5.4.2",
        4060: "COBOL Fixed OpenCOBOL 1.1.0",
        4061: "COBOL Free OpenCOBOL 1.1.0",
        4062: "Brainfuck bf 20041219",
        4063: "Ada Ada2012 GNAT 9.2.1",
        4064: "Unlambda 2.0.0",
        4065: "Cython 0.29.16",
        4066: "Sed 4.4",
        4067: "Vim 8.2.0460",
    };
    const languageId = new ObservableValue(eLanguage.val());
    eLanguage.change(() => {
        languageId.value = eLanguage.val();
    });
    const language = languageId.map(lang => langMap[lang]);
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
            let e = [...doc.querySelectorAll(selector)];
            e = e.filter(e => !e.closest(".io-style")); // practice2
            if (e.length == 0)
                continue;
            return pairs(e).map(([input, output], index) => ({
                title: `Sample ${index + 1}`,
                input: input.textContent,
                output: output.textContent,
                anchor: (input.closest(closestSelector) || input.parentElement).querySelector(".btn-copy"),
            }));
        }
        { // maximum_cup_2018_d
            let e = [...doc.querySelectorAll("#task-statement .div-btn-copy+pre")];
            e = e.filter(f => !f.childElementCount);
            if (e.length) {
                return pairs(e).map(([input, output], index) => ({
                    title: `Sample ${index + 1}`,
                    input: input.textContent,
                    output: output.textContent,
                    anchor: (input.closest(".part") || input.parentElement).querySelector(".btn-copy"),
                }));
            }
        }
        return [];
    }
    return {
        name: "AtCoder",
        language,
        get sourceCode() {
            return unsafeWindow.getSourceCode();
        },
        set sourceCode(sourceCode) {
            doc.querySelector(".plain-textarea").value = sourceCode;
            unsafeWindow.$(".editor").data("editor").doc.setValue(sourceCode);
        },
        submit() {
            doc.querySelector("#submit").click();
        },
        get testButtonContainer() {
            return doc.querySelector("#submit").parentElement;
        },
        get sideButtonContainer() {
            return doc.querySelector(".editor-buttons");
        },
        get bottomMenuContainer() {
            return doc.getElementById("main-div");
        },
        get resultListContainer() {
            return doc.querySelector(".form-code-submit");
        },
        get testCases() {
            return getTestCases();
        },
        get jQuery() {
            return unsafeWindow["jQuery"];
        },
    };
}

async function init$3() {
    if (location.host != "yukicoder.me")
        throw "Not yukicoder";
    const $ = unsafeWindow.$;
    const doc = unsafeWindow.document;
    const editor = unsafeWindow.ace.edit("rich_source");
    const eSourceObject = $("#source");
    const eLang = $("#lang");
    const eSamples = $(".sample");
    const langMap = {
        "cpp14": "C++ C++14 GCC 11.1.0 + Boost 1.77.0",
        "cpp17": "C++ C++17 GCC 11.1.0 + Boost 1.77.0",
        "cpp-clang": "C++ C++17 Clang 10.0.0 + Boost 1.76.0",
        "cpp23": "C++ C++11 GCC 8.4.1",
        "c11": "C++ C++11 GCC 11.1.0",
        "c": "C C90 GCC 8.4.1",
        "java8": "Java Java16 OpenJDK 16.0.1",
        "csharp": "C# CSC 3.9.0",
        "csharp_mono": "C# Mono 6.12.0.147",
        "csharp_dotnet": "C# .NET 5.0",
        "perl": "Perl 5.26.3",
        "raku": "Raku Rakudo v2021-07-2-g74d7ff771",
        "php": "PHP 7.2.24",
        "php7": "PHP 8.0.8",
        "python3": "Python3 3.9.6 + numpy 1.14.5 + scipy 1.1.0",
        "pypy2": "Python PyPy2 7.3.5",
        "pypy3": "Python3 PyPy3 7.3.5",
        "ruby": "Ruby 3.0.2p107",
        "d": "D DMD 2.097.1",
        "go": "Go 1.16.6",
        "haskell": "Haskell 8.10.5",
        "scala": "Scala 2.13.6",
        "nim": "Nim 1.4.8",
        "rust": "Rust 1.53.0",
        "kotlin": "Kotlin 1.5.21",
        "scheme": "Scheme Gauche 0.9.10",
        "crystal": "Crystal 1.1.1",
        "swift": "Swift 5.4.2",
        "ocaml": "OCaml 4.12.0",
        "clojure": "Clojure 1.10.2.790",
        "fsharp": "F# 5.0",
        "elixir": "Elixir 1.7.4",
        "lua": "Lua LuaJIT 2.0.5",
        "fortran": "Fortran gFortran 8.4.1",
        "node": "JavaScript Node.js 15.5.0",
        "typescript": "TypeScript 4.3.5",
        "lisp": "Lisp Common Lisp sbcl 2.1.6",
        "sml": "ML Standard ML MLton 20180207-6",
        "kuin": "Kuin KuinC++ v.2021.7.17",
        "vim": "Vim v8.2",
        "sh": "Bash 4.4.19",
        "nasm": "Assembler nasm 2.13.03",
        "clay": "cLay 20210917-1",
        "bf": "Brainfuck BFI 1.1",
        "Whitespace": "Whitespace 0.3",
        "text": "Text cat 8.3",
    };
    const language = new ObservableValue(langMap[eLang.val()]);
    eLang.on("change", () => {
        language.value = langMap[eLang.val()];
    });
    return {
        name: "yukicoder",
        language,
        get sourceCode() {
            if (eSourceObject.is(":visible"))
                return eSourceObject.val();
            return editor.getSession().getValue();
        },
        set sourceCode(sourceCode) {
            eSourceObject.val(sourceCode);
            editor.getSession().setValue(sourceCode);
        },
        submit() {
            doc.querySelector(`#submit_form input[type="submit"]`).click();
        },
        get testButtonContainer() {
            return doc.querySelector("#submit_form");
        },
        get sideButtonContainer() {
            return doc.querySelector("#toggle_source_editor").parentElement;
        },
        get bottomMenuContainer() {
            return doc.body;
        },
        get resultListContainer() {
            return doc.querySelector("#content");
        },
        get testCases() {
            const testCases = [];
            let sampleId = 1;
            for (let i = 0; i < eSamples.length; i++) {
                const eSample = eSamples.eq(i);
                const [eInput, eOutput] = eSample.find("pre");
                const anchorContainer = $(`<span>`);
                const anchor = $(`<span>`);
                anchorContainer.append(anchor);
                eSample.find("h6").eq(0).appendTo(anchorContainer);
                anchorContainer.insertAfter(eSample.find("button").eq(0));
                testCases.push({
                    title: `Sample ${sampleId++}`,
                    input: eInput.textContent,
                    output: eOutput.textContent,
                    anchor: anchor[0],
                });
            }
            return testCases;
        },
        get jQuery() {
            return $;
        },
    };
}

let data = {};
function toString() {
    return JSON.stringify(data);
}
function save() {
    GM_setValue("config", toString());
}
function load() {
    data = JSON.parse(GM_getValue("config") || "{}");
}
load();
/** プロパティ名は camelCase にすること */
const config = {
    getString(key, defaultValue = "") {
        if (!(key in data))
            config.setString(key, defaultValue);
        return data[key];
    },
    setString(key, value) {
        data[key] = value;
        save();
    },
    has(key) {
        return key in data;
    },
    get(key, defaultValue = null) {
        if (!(key in data))
            config.set(key, defaultValue);
        return JSON.parse(data[key]);
    },
    set(key, value) {
        config.setString(key, JSON.stringify(value));
    },
    save,
    load,
    toString,
};

class Editor {
    _element;
    constructor(lang) {
        this._element = document.createElement("textarea");
        this._element.style.fontFamily = "monospace";
        this._element.style.width = "100%";
        this._element.style.minHeight = "5em";
    }
    get element() {
        return this._element;
    }
    get sourceCode() {
        return this._element.value;
    }
    set sourceCode(sourceCode) {
        this._element.value = sourceCode;
    }
    setLanguage(lang) {
    }
}

var hPage = "<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n    <title>AtCoder Easy Test</title>\n    <link href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css\" rel=\"stylesheet\">\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"panel panel-default\">\n        <div class=\"panel-heading\">Settings</div>\n        <div class=\"panel-body\">\n          <form id=\"options\">\n          </form>\n        </div>\n      </div>\n    </div>\n    <script src=\"https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js\"></script>\n    <script src=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js\"></script>\n  </body>\n</html>";

const options = [];
const settings = {
    /** 設定ページを開く
     * クリックなどのイベント時にしか正しく実行できない
     */
    open() {
        const win = window.open("about:blank");
        const doc = win.document;
        doc.open();
        doc.write(hPage);
        doc.close();
        const root = doc.getElementById("options");
        for (const { type, key, defaultValue, description } of options) {
            switch (type) {
                case "checkbox": {
                    const container = newElement("div", { className: "checkbox" });
                    root.appendChild(container);
                    const label = newElement("label");
                    container.appendChild(label);
                    const element = newElement("input", {
                        type: "checkbox",
                        checked: config.get(key, defaultValue),
                    });
                    element.addEventListener("change", () => {
                        config.set(key, element.checked);
                    });
                    label.appendChild(element);
                    label.appendChild(document.createTextNode(description));
                    break;
                }
                default:
                    throw new TypeError(`AtCoderEasyTest.setting: undefined option type ${type} for ${key}`);
            }
        }
    },
    /** 設定項目を登録 */
    registerFlag(key, defaultValue, description) {
        options.push({
            type: "checkbox",
            key,
            defaultValue,
            description,
        });
    }
};

settings.registerFlag("codeforces.showEditor", true, "Show Editor in Codeforces Problem Page");
async function init$2() {
    if (location.host != "codeforces.com")
        throw "not Codeforces";
    //TODO: m1.codeforces.com, m2.codeforces.com, m3.codeforces.com に対応する
    const doc = unsafeWindow.document;
    const eLang = doc.querySelector("select[name='programTypeId']");
    doc.head.appendChild(newElement("link", {
        rel: "stylesheet",
        href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    }));
    const eButtons = newElement("span");
    doc.querySelector(".submitForm").appendChild(eButtons);
    await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
    const jQuery = unsafeWindow["jQuery"].noConflict();
    unsafeWindow["jQuery"] = unsafeWindow["$"];
    unsafeWindow["jQuery11"] = jQuery;
    await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });
    const langMap = {
        3: "Delphi 7",
        4: "Pascal Free Pascal 3.0.2",
        6: "PHP 7.2.13",
        7: "Python 2.7.18",
        9: "C# Mono 6.8",
        12: "Haskell GHC 8.10.1",
        13: "Perl 5.20.1",
        19: "OCaml 4.02.1",
        20: "Scala 2.12.8",
        28: "D DMD32 v2.091.0",
        31: "Python3 3.8.10",
        32: "Go 1.15.6",
        34: "JavaScript V8 4.8.0",
        36: "Java 1.8.0_241",
        40: "Python PyPy2 2.7 (7.3.0)",
        41: "Python3 PyPy3 3.7 (7.3.0)",
        43: "C C11 GCC 5.1.0",
        48: "Kotlin 1.5.31",
        49: "Rust 1.49.0",
        50: "C++ C++14 G++ 6.4.0",
        51: "Pascal PascalABC.NET 3.4.1",
        52: "C++ C++17 Clang++",
        54: "C++ C++17 G++ 7.3.0",
        55: "JavaScript Node.js 12.6.3",
        59: "C++ Microsoft Visual C++ 2017",
        60: "Java 11.0.6",
        61: "C++ C++17 9.2.0 (64 bit, msys 2)",
        65: "C# 8, .NET Core 3.1",
        67: "Ruby 3.0.0",
        70: "Python3 PyPy 3.7 (7.3.5, 64bit)",
        72: "Kotlin 1.5.31",
        73: "C++ GNU G++ 11.2.0 (64 bit, winlibs)",
    };
    const language = new ObservableValue(langMap[eLang.value]);
    eLang.addEventListener("change", () => {
        language.value = langMap[eLang.value];
    });
    let _sourceCode = "";
    const eFile = doc.querySelector(".submitForm").elements["sourceFile"];
    eFile.addEventListener("change", async () => {
        if (eFile.files[0]) {
            _sourceCode = await eFile.files[0].text();
            if (editor)
                editor.sourceCode = _sourceCode;
        }
    });
    let editor = null;
    let waitCfFastSubmitCount = 0;
    const waitCfFastSubmit = setInterval(() => {
        if (document.getElementById("editor")) {
            // cf-fast-submit
            if (editor && editor.element)
                editor.element.style.display = "none";
            // 言語セレクトを同期させる
            const eLang2 = doc.querySelector(".submit-form select[name='programTypeId']");
            if (eLang2) {
                eLang.addEventListener("change", () => {
                    eLang2.value = eLang.value;
                });
                eLang2.addEventListener("change", () => {
                    eLang.value = eLang2.value;
                    language.value = langMap[eLang.value];
                });
            }
            // TODO: 選択されたファイルをどうかする
            // エディタを使う
            const aceEditor = unsafeWindow["ace"].edit("editor");
            editor = {
                get sourceCode() {
                    return aceEditor.getValue();
                },
                set sourceCode(sourceCode) {
                    aceEditor.setValue(sourceCode);
                },
                setLanguage(lang) { },
            };
            // ボタンを追加する
            const buttonContainer = doc.querySelector(".submit-form .submit").parentElement;
            buttonContainer.appendChild(newElement("a", {
                className: "btn btn-info",
                textContent: "Test & Submit",
                onclick: () => events.trig("testAndSubmit"),
            }));
            buttonContainer.appendChild(newElement("a", {
                className: "btn btn-default",
                textContent: "Test All Samples",
                onclick: () => events.trig("testAllSamples"),
            }));
            clearInterval(waitCfFastSubmit);
        }
        else {
            waitCfFastSubmitCount++;
            if (waitCfFastSubmitCount >= 100)
                clearInterval(waitCfFastSubmit);
        }
    }, 100);
    if (config.get("codeforces.showEditor", true)) {
        editor = new Editor(langMap[eLang.value].split(" ")[0]);
        doc.getElementById("pageContent").appendChild(editor.element);
        language.addListener(lang => {
            editor.setLanguage(lang);
        });
    }
    return {
        name: "Codeforces",
        language,
        get sourceCode() {
            if (editor)
                return editor.sourceCode;
            return _sourceCode;
        },
        set sourceCode(sourceCode) {
            const container = new DataTransfer();
            container.items.add(new File([sourceCode], "prog.txt", { type: "text/plain" }));
            const eFile = doc.querySelector(".submitForm").elements["sourceFile"];
            eFile.files = container.files;
            _sourceCode = sourceCode;
            if (editor)
                editor.sourceCode = sourceCode;
        },
        submit() {
            if (editor)
                _sourceCode = editor.sourceCode;
            this.sourceCode = _sourceCode;
            doc.querySelector(`.submitForm .submit`).click();
        },
        get testButtonContainer() {
            return eButtons;
        },
        get sideButtonContainer() {
            return eButtons;
        },
        get bottomMenuContainer() {
            return doc.body;
        },
        get resultListContainer() {
            return doc.querySelector("#pageContent");
        },
        get testCases() {
            return [...doc.querySelectorAll(".sample-test")].map((e, i) => ({
                title: `Sample ${i + 1}`,
                input: e.querySelector(".input pre").textContent,
                output: e.querySelector(".output pre").textContent,
                anchor: e.querySelector(".input .title"),
            }));
        },
        get jQuery() {
            return jQuery;
        },
    };
}

async function init$1() {
    if (location.host != "greasyfork.org" && !location.href.match(/433152-atcoder-easy-test-v2/))
        throw "Not about page";
    const doc = unsafeWindow.document;
    await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
    const jQuery = unsafeWindow["jQuery"];
    await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });
    const e = newElement("div");
    doc.getElementById("install-area").appendChild(newElement("button", {
        type: "button",
        textContent: "Open Settings",
        onclick: () => settings.open(),
    }));
    return {
        name: "About Page",
        language: new ObservableValue(""),
        get sourceCode() { return ""; },
        set sourceCode(sourceCode) { },
        submit() { },
        get testButtonContainer() { return e; },
        get sideButtonContainer() { return e; },
        get bottomMenuContainer() { return e; },
        get resultListContainer() { return e; },
        get testCases() { return []; },
        get jQuery() { return jQuery; },
    };
}

// 設定ページが開けなくなるのを避ける
const inits = [init$1()];
settings.registerFlag("site.atcoder", true, "Use AtCoder Easy Test in AtCoder");
if (config.get("site.atcoder", true))
    inits.push(init$4());
settings.registerFlag("site.yukicoder", true, "Use AtCoder Easy Test in yukicoder");
if (config.get("site.yukicoder", true))
    inits.push(init$3());
settings.registerFlag("site.codeforces", true, "Use AtCoder Easy Test in Codeforces");
if (config.get("site.codeforces", true))
    inits.push(init$2());
var pSite = Promise.any(inits);

const runners = {
    "C GCC 10.1.0 Wandbox": new WandboxRunner("gcc-10.1.0-c", "C (GCC 10.1.0)"),
    "C C17 Clang 10.0.0 paiza.io": new PaizaIORunner("c", "C (C17 / Clang 10.0.0)"),
    "C++ GCC 10.1.0 + Boost 1.73.0 + ACL Wandbox": new WandboxCppRunner("gcc-10.1.0", "C++ (GCC 10.1.0) + ACL", { options: "warning,boost-1.73.0-gcc-9.2.0,gnu++17" }),
    "C++ Clang 10.0.0 + ACL Wandbox": new WandboxCppRunner("clang-10.0.0", "C++ (Clang 10.0.0) + ACL", { options: "warning,boost-nothing-clang-10.0.0,c++17" }),
    "Python3 CPython 3.8.2 paiza.io": new PaizaIORunner("python3", "Python (3.8.2)"),
    "Python3 Brython": brythonRunner,
    "Python3 Pyodide": pyodideRunner,
    "Bash 5.0.17 paiza.io": new PaizaIORunner("bash", "Bash (5.0.17)"),
    "C# .NET Core 6.0.100-alpha.1.20562.2 Wandbox": new WandboxRunner("csharp", "C# (.NET Core 6.0.100-alpha.1.20562.2)"),
    "C# Mono-mcs HEAD Wandbox": new WandboxRunner("mono-head", "C# (Mono-mcs HEAD)"),
    "Clojure 1.10.1-1 paiza.io": new PaizaIORunner("clojure", "Clojure (1.10.1-1)"),
    "D LDC 1.23.0 paiza.io": new PaizaIORunner("d", "D (LDC 1.23.0)"),
    "Erlang 10.6.4 paiza.io": new PaizaIORunner("erlang", "Erlang (10.6.4)"),
    "Elixir 1.10.4 paiza.io": new PaizaIORunner("elixir", "Elixir (1.10.4)"),
    "F# Interactive 4.0 paiza.io": new PaizaIORunner("fsharp", "F# (Interactive 4.0)"),
    "Go 1.14.1 Wandbox": new WandboxRunner("go-1.14.1", "Go (1.14.1)"),
    "Haskell GHC HEAD Wandbox": new WandboxRunner("ghc-head", "Haskell (GHC HEAD)"),
    "JavaScript Node.js paiza.io": new PaizaIORunner("javascript", "JavaScript (Node.js 12.18.3)"),
    "Kotlin 1.4.0 paiza.io": new PaizaIORunner("kotlin", "Kotlin (1.4.0)"),
    "Lua 5.3.4 Wandbox": new WandboxRunner("lua-5.3.4", "Lua (Lua 5.3.4)"),
    "Lua LuaJIT HEAD Wandbox": new WandboxRunner("luajit-head", "Lua (LuaJIT HEAD)"),
    "Nim 1.0.6 Wandbox": new WandboxRunner("nim-1.0.6", "Nim (1.0.6)"),
    "Objective-C Clang 10.0.0 paiza.io": new PaizaIORunner("objective-c", "Objective-C (Clang 10.0.0)"),
    "Ocaml HEAD Wandbox": new WandboxRunner("ocaml-head", "OCaml (HEAD)"),
    "Pascal FPC 3.0.2 Wandbox": new WandboxRunner("fpc-3.0.2", "Pascal (FPC 3.0.2)"),
    "Perl 5.30.0 paiza.io": new PaizaIORunner("perl", "Perl (5.30.0)"),
    "PHP 7.4.10 paiza.io": new PaizaIORunner("php", "PHP (7.4.10)"),
    "PHP 7.3.3 Wandbox": new WandboxRunner("php-7.3.3", "PHP (7.3.3)"),
    "Python PyPy HEAD Wandbox": new WandboxRunner("pypy-head", "PyPy2 (HEAD)"),
    "Python3 PyPy3 7.2.0 Wandbox": new WandboxRunner("pypy-7.2.0-3", "PyPy3 (7.2.0)"),
    "Ruby 2.7.1 paiza.io": new PaizaIORunner("ruby", "Ruby (2.7.1)"),
    "Ruby HEAD Wandbox": new WandboxRunner("ruby-head", "Ruby (HEAD)"),
    "Ruby 2.7.1 Wandbox": new WandboxRunner("ruby-2.7.1", "Ruby (2.7.1)"),
    "Rust 1.42.0 AtCoder": new AtCoderRunner("4050", "Rust (1.42.0)"),
    "Rust HEAD Wandbox": new WandboxRunner("rust-head", "Rust (HEAD)"),
    "Rust 1.43.0 paiza.io": new PaizaIORunner("rust", "Rust (1.43.0)"),
    "Scala 2.13.3 paiza": new PaizaIORunner("scala", "Scala (2.13.3)"),
    "Scheme Gauche 0.9.6 paiza.io": new PaizaIORunner("scheme", "Scheme (Gauche 0.9.6)"),
    "Swift 5.2.5 paiza.io": new PaizaIORunner("swift", "Swift (5.2.5)"),
    "Text local": new CustomRunner("Text", async (sourceCode, input) => {
        return {
            status: "OK",
            exitCode: "0",
            input,
            output: sourceCode,
        };
    }),
    "Basic Visual Basic .NET Core 4.0.1 paiza.io": new PaizaIORunner("vb", "Visual Basic (.NET Core 4.0.1)"),
    "COBOL Free OpenCOBOL 2.2.0 paiza.io": new PaizaIORunner("cobol", "COBOL - Free (OpenCOBOL 2.2.0)"),
    "COBOL Fixed OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4060", "COBOL - Fixed (OpenCOBOL 1.1.0)"),
    "COBOL Free OpenCOBOL 1.1.0 AtCoder": new AtCoderRunner("4061", "COBOL - Free (OpenCOBOL 1.1.0)"),
    "C++ GCC 9.2.0 + ACL Wandbox": new WandboxCppRunner("gcc-9.2.0", "C++ (GCC 9.2.0) + ACL"),
};
pSite.then(site => {
    if (site.name == "AtCoder") {
        // AtCoderRunner がない場合は、追加する
        for (const e of document.querySelectorAll("#select-lang option[value]")) {
            const m = e.textContent.match(/([^ ]+) \(([^)]+)\)/);
            if (m) {
                const name = `${m[1]} ${m[2]} AtCoder`;
                const languageId = e.value;
                runners[name] = new AtCoderRunner(languageId, e.textContent);
            }
        }
    }
});
console.info("AtCoder Easy Test: codeRunner OK");
var codeRunner = {
    // 指定した環境でコードを実行する
    run(languageId, sourceCode, input, expectedOutput, options = { trim: true, split: true }) {
        // CodeRunner が存在しない言語ID
        if (!(languageId in runners))
            return Promise.reject("Language not supported");
        // 最後に実行したコードを保存
        if (sourceCode.length > 0)
            codeSaver.save(sourceCode);
        // 実行
        return runners[languageId].test(sourceCode, input, expectedOutput, options);
    },
    // 環境の名前の一覧を取得する
    async getEnvironment(languageId) {
        const langs = similarLangs(languageId, Object.keys(runners));
        if (langs.length == 0)
            throw `Undefined language: ${languageId}`;
        return langs.map(lang => [lang, runners[lang].label]);
    },
};

var hBottomMenu = "<div id=\"bottom-menu-wrapper\" class=\"navbar navbar-default navbar-fixed-bottom\">\n  <div class=\"container\">\n    <div class=\"navbar-header\">\n      <button id=\"bottom-menu-key\" type=\"button\" class=\"navbar-toggle collapsed glyphicon glyphicon-menu-down\" data-toggle=\"collapse\" data-target=\"#bottom-menu\"></button>\n    </div>\n    <div id=\"bottom-menu\" class=\"collapse navbar-collapse\">\n      <ul id=\"bottom-menu-tabs\" class=\"nav nav-tabs\"></ul>\n      <div id=\"bottom-menu-contents\" class=\"tab-content\"></div>\n    </div>\n  </div>\n</div>";

var hStyle$1 = "<style>\n#bottom-menu-wrapper {\n  background: transparent;\n  border: none;\n  pointer-events: none;\n  padding: 0;\n}\n\n#bottom-menu-wrapper>.container {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  padding: 0;\n}\n\n#bottom-menu-wrapper>.container>.navbar-header {\n  float: none;\n}\n\n#bottom-menu-key {\n  display: block;\n  float: none;\n  margin: 0 auto;\n  padding: 10px 3em;\n  border-radius: 5px 5px 0 0;\n  background: #000;\n  opacity: 0.5;\n  color: #FFF;\n  cursor: pointer;\n  pointer-events: auto;\n  text-align: center;\n}\n\n@media screen and (max-width: 767px) {\n  #bottom-menu-key {\n    opacity: 0.25;\n  }\n}\n\n#bottom-menu-key.collapsed:before {\n  content: \"\\e260\";\n}\n\n#bottom-menu-tabs {\n  padding: 3px 0 0 10px;\n  cursor: n-resize;\n}\n\n#bottom-menu-tabs a {\n  pointer-events: auto;\n}\n\n#bottom-menu {\n  pointer-events: auto;\n  background: rgba(0, 0, 0, 0.8);\n  color: #fff;\n  max-height: unset;\n}\n\n#bottom-menu.collapse:not(.in) {\n  display: none !important;\n}\n\n#bottom-menu-tabs>li>a {\n  background: rgba(150, 150, 150, 0.5);\n  color: #000;\n  border: solid 1px #ccc;\n  filter: brightness(0.75);\n}\n\n#bottom-menu-tabs>li>a:hover {\n  background: rgba(150, 150, 150, 0.5);\n  border: solid 1px #ccc;\n  color: #111;\n  filter: brightness(0.9);\n}\n\n#bottom-menu-tabs>li.active>a {\n  background: #eee;\n  border: solid 1px #ccc;\n  color: #333;\n  filter: none;\n}\n\n.bottom-menu-btn-close {\n  font-size: 8pt;\n  vertical-align: baseline;\n  padding: 0 0 0 6px;\n  margin-right: -6px;\n}\n\n#bottom-menu-contents {\n  padding: 5px 15px;\n  max-height: 50vh;\n  overflow-y: auto;\n}\n\n#bottom-menu-contents .panel {\n  color: #333;\n}\n</style>";

async function init() {
    const site = await pSite;
    const style = html2element(hStyle$1);
    const bottomMenu = html2element(hBottomMenu);
    unsafeWindow.document.head.appendChild(style);
    site.bottomMenuContainer.appendChild(bottomMenu);
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
            const tab = site.jQuery(`#bottom-menu-tab-${tabId}`);
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
            // 閉じるボタン
            if (options.closeButton) {
                const btn = document.createElement("a");
                btn.className = "bottom-menu-btn-close btn btn-link glyphicon glyphicon-remove";
                btn.addEventListener("click", () => {
                    controller.close();
                });
                tab.appendChild(btn);
            }
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
    return menuController;
}

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
            button.addEventListener("click", async () => {
                (await tab).show();
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
        for (const pTab of this._tabs)
            pTab.then(tab => tab.close());
        const parent = this._element.parentElement;
        if (parent)
            parent.removeChild(this._element);
    }
}

var hResultList = "<div class=\"row\"></div>";

const eResultList = html2element(hResultList);
pSite.then(site => site.resultListContainer.appendChild(eResultList));
const resultList = {
    addResult(pairs) {
        const result = new ResultRow(pairs);
        eResultList.insertBefore(result.element, eResultList.firstChild);
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

var hRoot = "<form id=\"atcoder-easy-test-container\" class=\"form-horizontal\">\n  <div class=\"row\">\n      <div class=\"col-xs-12 col-lg-8\">\n          <div class=\"form-group\">\n              <label class=\"control-label col-sm-2\">Test Environment</label>\n              <div class=\"col-sm-10\">\n                  <select class=\"form-control\" id=\"atcoder-easy-test-language\"></select>\n              </div>\n          </div>\n          <div class=\"form-group\">\n              <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-input\">Standard Input</label>\n              <div class=\"col-sm-10\">\n                  <textarea id=\"atcoder-easy-test-input\" name=\"input\" class=\"form-control\" rows=\"3\"></textarea>\n              </div>\n          </div>\n      </div>\n      <div class=\"col-xs-12 col-lg-4\">\n          <details close>\n              <summary>Expected Output</summary>\n              <div class=\"form-group\">\n                  <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-allowable-error-check\">Allowable Error</label>\n                  <div class=\"col-sm-10\">\n                      <div class=\"input-group\">\n                          <span class=\"input-group-addon\">\n                              <input id=\"atcoder-easy-test-allowable-error-check\" type=\"checkbox\" checked=\"checked\">\n                          </span>\n                          <input id=\"atcoder-easy-test-allowable-error\" type=\"text\" class=\"form-control\" value=\"1e-6\">\n                      </div>\n                  </div>\n              </div>\n              <div class=\"form-group\">\n                  <label class=\"control-label col-sm-2\" for=\"atcoder-easy-test-output\">Expected Output</label>\n                  <div class=\"col-sm-10\">\n                      <textarea id=\"atcoder-easy-test-output\" name=\"output\" class=\"form-control\" rows=\"3\"></textarea>\n                  </div>\n              </div>\n          </details>\n      </div>\n      <div class=\"col-xs-12 col-md-6\">\n          <div class=\"col-xs-11 col-xs-offset=1\">\n              <div class=\"form-group\">\n                  <a id=\"atcoder-easy-test-run\" class=\"btn btn-primary\">Run</a>\n              </div>\n          </div>\n      </div>\n      <div class=\"col-xs-12 col-md-6\">\n          <div class=\"col-xs-11 col-xs-offset=1\">\n              <div class=\"form-group text-right\">\n                  <small>AtCoder Easy Test v<span id=\"atcoder-easy-test-version\"></span></small>\n                  <a id=\"atcoder-easy-test-setting\" class=\"btn btn-xs btn-default\">Setting</a>\n              </div>\n          </div>\n      </div>\n  </div>\n  <style>\n  #atcoder-easy-test-language {\n      border: none;\n      background: transparent;\n      font: inherit;\n      color: #fff;\n  }\n  #atcoder-easy-test-language option {\n      border: none;\n      color: #333;\n      font: inherit;\n  }\n  </style>\n</form>";

var hStyle = "<style>\n.atcoder-easy-test-result textarea {\n  font-family: monospace;\n  font-weight: normal;\n}\n</style>";

var hRunButton = "<a class=\"btn btn-primary btn-sm\" style=\"vertical-align: top; margin-left: 0.5em\">Run</a>";

var hTestAndSubmit = "<a id=\"atcoder-easy-test-btn-test-and-submit\" class=\"btn btn-info btn\" style=\"margin-left: 1rem\" title=\"Ctrl+Enter\" data-toggle=\"tooltip\">Test &amp; Submit</a>";

var hTestAllSamples = "<a id=\"atcoder-easy-test-btn-test-all\" class=\"btn btn-default btn-sm\" style=\"margin-left: 1rem\" title=\"Alt+Enter\" data-toggle=\"tooltip\">Test All Samples</a>";

(async () => {
    const site = await pSite;
    const doc = unsafeWindow.document;
    // init bottomMenu
    const pBottomMenu = init();
    pBottomMenu.then(bottomMenu => {
        unsafeWindow.bottomMenu = bottomMenu;
    });
    await doneOrFail(pBottomMenu);
    // external interfaces
    unsafeWindow.codeRunner = codeRunner;
    doc.head.appendChild(html2element(hStyle));
    // interface
    const atCoderEasyTest = {
        config,
        codeSaver,
        enableButtons() {
            events.trig("enable");
        },
        disableButtons() {
            events.trig("disable");
        },
        runCount: 0,
        runTest(title, language, sourceCode, input, output = null, options = { trim: true, split: true, }) {
            this.disableButtons();
            const content = new ResultTabContent();
            const pTab = pBottomMenu.then(bottomMenu => bottomMenu.addTab("easy-test-result-" + content.uid, `#${++this.runCount} ${title}`, content.element, { active: true, closeButton: true }));
            const pResult = codeRunner.run(language, sourceCode, input, output, options);
            pResult.then(result => {
                content.result = result;
                if (result.status == "AC") {
                    pTab.then(tab => tab.color = "#dff0d8");
                }
                else if (result.status != "OK") {
                    pTab.then(tab => tab.color = "#fcf8e3");
                }
            }).finally(() => {
                this.enableButtons();
            });
            return [pResult, pTab];
        }
    };
    unsafeWindow.atCoderEasyTest = atCoderEasyTest;
    // place "Easy Test" tab
    {
        // declare const hRoot: string;
        const root = html2element(hRoot);
        const E = (id) => root.querySelector(`#atcoder-easy-test-${id}`);
        const eLanguage = E("language");
        const eInput = E("input");
        const eAllowableErrorCheck = E("allowable-error-check");
        const eAllowableError = E("allowable-error");
        const eOutput = E("output");
        const eRun = E("run");
        const eSetting = E("setting");
        E("version").textContent = "2.7.1";
        events.on("enable", () => {
            eRun.classList.remove("disabled");
        });
        events.on("disable", () => {
            eRun.classList.remove("enabled");
        });
        eSetting.addEventListener("click", () => {
            settings.open();
        });
        // 言語選択関係
        {
            eLanguage.addEventListener("change", async () => {
                const langSelection = config.get("langSelection", {});
                langSelection[site.language.value] = eLanguage.value;
                config.set("langSelection", langSelection);
            });
            async function setLanguage() {
                const languageId = site.language.value;
                while (eLanguage.firstChild)
                    eLanguage.removeChild(eLanguage.firstChild);
                try {
                    const langs = await codeRunner.getEnvironment(languageId);
                    console.log(`language: ${langs[1]} (${langs[0]})`);
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
                        const [lang, _] = langs.find(([lang, label]) => lang == prev);
                        if (lang)
                            eLanguage.value = lang;
                    }
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
            site.language.addListener(() => setLanguage());
            eAllowableError.disabled = !eAllowableErrorCheck.checked;
            eAllowableErrorCheck.addEventListener("change", event => {
                eAllowableError.disabled = !eAllowableErrorCheck.checked;
            });
        }
        // テスト実行
        function runTest(title, input, output = null) {
            const options = { trim: true, split: true, };
            if (eAllowableErrorCheck.checked) {
                options.allowableError = parseFloat(eAllowableError.value);
            }
            return atCoderEasyTest.runTest(title, eLanguage.value, site.sourceCode, input, output, options);
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
        await doneOrFail(pBottomMenu.then(bottomMenu => bottomMenu.addTab("easy-test", "Easy Test", root)));
        // place "Run" button on each sample
        for (const testCase of site.testCases) {
            const eRunButton = html2element(hRunButton);
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
            const button = html2element(hTestAndSubmit);
            site.testButtonContainer.appendChild(button);
            const testAndSubmit = async () => {
                await runAllCases(site.testCases);
                site.submit();
            };
            button.addEventListener("click", testAndSubmit);
            events.on("testAndSubmit", testAndSubmit);
        }
        // place "Test All Samples" button
        {
            const button = html2element(hTestAllSamples);
            site.testButtonContainer.appendChild(button);
            const testAllSamples = () => runAllCases(site.testCases);
            button.addEventListener("click", testAllSamples);
            events.on("testAllSamples", testAllSamples);
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
                if (site.sourceCode.length == 0 || confirm("Your current code will be replaced. Are you sure?")) {
                    site.sourceCode = lastCode;
                }
            }
            catch (reason) {
                alert(reason);
            }
        });
        site.sideButtonContainer.appendChild(restoreButton);
    }
    catch (e) {
        console.error(e);
    }
    // キーボードショートカット
    settings.registerFlag("useKeyboardShortcut", true, "Use Keyboard Shortcuts");
    unsafeWindow.addEventListener("keydown", (event) => {
        if (config.get("useKeyboardShortcut", true)) {
            if (event.key == "Enter" && event.ctrlKey) {
                events.trig("testAndSubmit");
            }
            else if (event.key == "Enter" && event.altKey) {
                events.trig("testAllSamples");
            }
            else if (event.key == "Escape" && event.altKey) {
                pBottomMenu.then(bottomMenu => bottomMenu.toggle());
            }
        }
    });
})();
})();
