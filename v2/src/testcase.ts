export interface TestCase {
  title: string,
  input: string,
  output: string,
  anchor: HTMLElement,
}

export function getTestCases(): TestCase[] {
  const selectors = [
    ["#task-statement p+pre.literal-block", ".section"], // utpc2011_1
    ["#task-statement pre.source-code-for-copy", ".part"],
    ["#task-statement .lang>*:nth-child(1) .div-btn-copy+pre", ".part"],
    ["#task-statement .div-btn-copy+pre", ".part"],
    ["#task-statement>.part pre.linenums", ".part"], // abc003_4
    ["#task-statement>.part:not(.io-style)>h3+section>pre", ".part"],
    ["#task-statement pre", ".part"],
  ];
  
  for (const [selector, closestSelector] of selectors) {
    const e = [... document.querySelectorAll(selector)].filter(e => {
      if (e.closest(".io-style")) return false; // practice2
      return true;
    });
    if (e.length == 0) continue;
    const testcases = [];
    let sampleId = 1;
    for (let i = 0; i < e.length; i += 2) {
      const container = e[i].closest(closestSelector) || e[i].parentElement;
      testcases.push({
        title: `Sample ${sampleId++}`,
        input: (e[i]||{}).textContent,
        output: (e[i+1]||{}).textContent,
        anchor: container.querySelector("h3"),
      });
    }
    return testcases;
  }
  
  return [];
};