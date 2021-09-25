import { html2element } from "../util";
import hTabTemplate from "./tabTemplate.html";

declare const hTabTemplate: string;
const tabTemplate = html2element(hTabTemplate) as HTMLDivElement;

export default class ResultTabContent {
  private _title: string | null;
  private _uid: string;
  private _element: HTMLElement;

  constructor() {
    this._uid = Date.now().toString(16);
    this._element = tabTemplate.cloneNode(true);
    this._element.id = `atcoder-easy-test-result-${this._uid}`;
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
    this._get("col-input").classList.add("col-sm-6");
    this._get("col-expected-output").classList.remove("hidden");
  }

  get expectedOutputStyle(): CSSStyleDeclaration {
    return this._get("expected-output").style;
  }

  set output(output: string) {
    this._get<HTMLTextAreaElement>("")
  }

  get outputStyle(): CSSStyleDeclaration {
    return this._get("output").style;
  }

  set error(error: string) {
    this._get<HTMLTextAreaElement>("error").value = error;
    this._get("col-output").classList.add("col-md-6");
    this._get("col-error").classList.remove("hidden");
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