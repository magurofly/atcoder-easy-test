import Result from "../codeRunner/Result";
import { html2element } from "../util";
import ResultRow from "./ResultRow";
import BottomMenuTab from "../bottomMenu/BottomMenuTab";
import hResultList from "./resultList.html";
import pSite from "../site";

const eResultList = html2element(hResultList) as HTMLDivElement;
pSite.then(site => site.resultListContainer.appendChild(eResultList));

const resultList = {
  addResult(pairs: [Promise<Result>, Promise<BottomMenuTab>][]): ResultRow {
    const result = new ResultRow(pairs);
    eResultList.insertBefore(result.element, eResultList.firstChild);
    return result;
  },
};

export default resultList;