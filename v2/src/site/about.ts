import TestCase from "../TestCase";
import { loadScript, newElement, ObservableValue } from "../util";

async function init() {
  if (location.host != "greasyfork.org" && !location.href.match(/433152-atcoder-easy-test-v2/)) throw "Not about page";

  unsafeWindow.document.head.appendChild(newElement("link", {
    rel: "stylesheet",
    href: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
  }));
  await loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
  const jQuery = unsafeWindow["jQuery"];
  await loadScript("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js", null, { jQuery, $: jQuery });

  const e = newElement("div");

  return {
    name: "About Page",
    language: new ObservableValue(""),
    get sourceCode(): string { return ""; },
    set sourceCode(sourceCode: string) {},
    submit(): void {},
    get testButtonContainer(): HTMLElement { return e; },
    get sideButtonContainer(): HTMLElement { return e; },
    get bottomMenuContainer(): HTMLElement { return document.body; },
    get resultListContainer(): HTMLElement { return e; },
    get testCases(): TestCase[] { return []; },
    get jQuery(): any { return jQuery; },
  };
}

export default init;