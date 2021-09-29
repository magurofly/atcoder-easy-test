import Result from "../codeRunner/Result";
import { html2element } from "../util";
import ResultRow from "./ResultRow";
import TabController from "../bottomMenu/TabController";
import hResultList from "./resultList.html";

const eResultList = html2element(hResultList) as HTMLDivElement;
unsafeWindow.document.querySelector(".form-code-submit").appendChild(eResultList);

const resultList = {
  addResult(pairs: [Promise<Result>, TabController][]): ResultRow {
    const result = new ResultRow(pairs);
    eResultList.appendChild(result.element);
    return result;
  },
};

export default resultList;