import { html2element } from "../util";
import events from "../events";
import hTabTemplate from "./tabTemplate.html";
import Result from "../codeRunner/Result";

function setClassFromData(element: HTMLElement, name: string) {
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

export default class ResultTabContent {
  private _title: string | null;
  private _uid: string;
  private _element: HTMLElement;
  private _result: Result | null;

  constructor() {
    this._uid = Date.now().toString(16);
    this._result = null;
    this._element = html2element(hTabTemplate) as HTMLDivElement;
    this._element.id = `atcoder-easy-test-result-${this._uid}`;
  }

  set result(result: Result) {
    this._result = result;

    if (result.status == "AC") {
      this.outputStyle.backgroundColor = "#dff0d8";
    } else if (result.status != "OK") {
      this.outputStyle.backgroundColor = "#fcf8e3";
    }

    this.input = result.input;
    if ("output" in result) this.expectedOutput = result.output;

    this.exitCode = result.exitCode;
    if ("execTime" in result) this.execTime = `${result.execTime} ms`;
    if ("memory" in result) this.memory = `${result.memory} KB`;
    if ("output" in result) this.output = result.output;
    if (result.error) this.error = result.error;
  }

  get result(): Result | null {
    return this._result;
  }

  get uid(): string {
    return this._uid;
  }

  get element(): HTMLElement {
    return this._element;
  }

  set title(title: string | null) {
    this._title = title;
  }

  get title(): string | null {
    return this._title;
  }

  set input(input: string) {
    this._get<HTMLTextAreaElement>("input").value = input;
  }

  get inputStyle(): CSSStyleDeclaration {
    return this._get("input").style;
  }

  set expectedOutput(output: string) {
    this._get<HTMLTextAreaElement>("expected-output").value = output;
    setClassFromData(this._get("col-input"), "ifExpectedOutput");
    setClassFromData(this._get("col-expected-output"), "ifExpectedOutput");
  }

  get expectedOutputStyle(): CSSStyleDeclaration {
    return this._get("expected-output").style;
  }

  set output(output: string) {
    this._get<HTMLTextAreaElement>("output").value = output;
  }

  get outputStyle(): CSSStyleDeclaration {
    return this._get("output").style;
  }

  set error(error: string) {
    this._get<HTMLTextAreaElement>("error").value = error;
    setClassFromData(this._get("col-output"), "ifError");
    setClassFromData(this._get("col-error"), "ifError");
  }

  set exitCode(code: string) {
    const element = this._get("exit-code");
    element.textContent = code;
    const isSuccess = code == "0";
    element.classList.toggle("bg-success", isSuccess);
    element.classList.toggle("bg-danger", !isSuccess);
  }

  set execTime(time: string) {
    this._get("exec-time").textContent = time;
  }

  set memory(memory: string) {
    this._get("memory").textContent = memory;
  }

  private _get<T extends HTMLElement>(name: string): T {
    return this._element.querySelector<T>(`.atcoder-easy-test-result-${name}`);
  }
}