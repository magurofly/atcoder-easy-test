import Result from "../codeRunner/Result";
import BottomMenuTab from "../bottomMenu/BottomMenuTab";
import { html2element } from "../util";
import hRowTemplate from "./rowTemplate.html";

export default class ResultRow {
  private _tabs: Promise<BottomMenuTab>[];
  private _element: HTMLDivElement;
  private _promise: Promise<void[]>;

  constructor(pairs: [Promise<Result>, Promise<BottomMenuTab>][]) {
    this._tabs = pairs.map(([_, tab]) => tab);
    this._element = html2element(hRowTemplate) as HTMLDivElement;

    const numCases = pairs.length;
    let numFinished = 0;
    let numAccepted = 0;
    const progressBar = this._element.querySelector<HTMLDivElement>(".progress-bar");
    progressBar.textContent = `${numFinished} / ${numCases}`;
    
    this._promise = Promise.all(pairs.map(([pResult, tab]) => {
      const button = html2element(`<div class="label label-default" style="margin: 3px; cursor: pointer;">WJ</div>`) as HTMLDivElement;
      button.addEventListener("click", async () => {
        (await tab).show();
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
    for (const pTab of this._tabs) pTab.then(tab => tab.close());
    const parent = this._element.parentElement;
    if (parent) parent.removeChild(this._element);
  }
}