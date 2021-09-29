import Result from "../codeRunner/Result";
import TabController from "../bottomMenu/TabController";
import hRowTemplate from "./rowTemplate.html";
import { html2element } from "../util";
import resultList from ".";

export default class ResultRow {
  private _tabs: TabController[];
  private _element: HTMLDivElement;
  private _promise: Promise<void[]>;

  constructor(pairs: [Promise<Result>, TabController][]) {
    this._tabs = pairs.map(([_, tab]) => tab);
    this._element = html2element(hRowTemplate) as HTMLDivElement;

    const numCases = pairs.length;
    let numFinished = 0;
    let numAccepted = 0;
    const progressBar = this._element.querySelector<HTMLDivElement>(".progress-bar");
    progressBar.textContent = `${numFinished} / ${numCases}`;
    
    this._promise = Promise.all(pairs.map(([pResult, tab]) => {
      const button = html2element(`<div class="label label-default" style="margin: 3px; cursor: pointer;">WJ</div>`) as HTMLDivElement;
      button.addEventListener("click", () => {
        tab.show();
      });
      this._element.appendChild(button);

      return pResult.then(result => {
        button.textContent = result.status;
        if (result.status == "AC") {
          button.classList.add("label-success");
        } else if (result.status != "OK") {
          button.classList.add("label-warning");
        }

        numFinished++;
        if (result.status == "AC") numAccepted++;
        progressBar.textContent = `${numFinished} / ${numCases}`;
        progressBar.style.width = `${100 * numFinished / numCases}%`;

        if (numFinished == numCases) {
          if (numAccepted == numCases) this._element.classList.add("alert-success");
          else this._element.classList.add("alert-warning");
        }
      }).catch(reason => {
        button.textContent = "IE";
        button.classList.add("label-danger");
        console.error(reason);
      });
    }));
  }

  get element(): HTMLElement {
    return this._element;
  }

  onFinish(listener: () => void): void {
    this._promise.then(listener);
  }

  remove(): void {
    for (const tab of this._tabs) tab.close();
    const parent = this._element.parentElement;
    if (parent) parent.removeChild(this._element);
  }
}