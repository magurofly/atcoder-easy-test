import TestCase from "../TestCase";
import { loadScript, newElement, ObservableValue } from "../util";
import config from "../config";

async function init() {
  if (location.host != "greasyfork.org" && !location.href.match(/433152-atcoder-easy-test-v2/)) throw "Not about page";

  const doc = unsafeWindow.document;

  await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
  const jQuery = unsafeWindow["jQuery"];
  await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });

  const e = newElement("div");

  doc.getElementById("install-area").appendChild(newElement("button", {
    type: "button",
    textContent: "Open config",
    onclick: () => config.open(),
  }));

  return {
    name: "About Page",
    language: new ObservableValue(""),
    get sourceCode(): string { return ""; },
    set sourceCode(sourceCode: string) {},
    submit(): void {},
    get testButtonContainer(): HTMLElement { return e; },
    get sideButtonContainer(): HTMLElement { return e; },
    get bottomMenuContainer(): HTMLElement { return e; },
    get resultListContainer(): HTMLElement { return e; },
    get testCases(): TestCase[] { return []; },
    get jQuery(): any { return jQuery; },
  };
}

export default init;