import { newElement } from "../util";
import hPage from "./page.html";

const components: { title: string; generator: (win: Window) => Node; }[] = [];

const settings = {
  add(title: string, generator: (win: Window) => Node): void {
    components.push({ title, generator });
  },

  open() {
    const win = window.open("about:blank");
    const doc = win.document;
    doc.open();
    doc.write(hPage);
    doc.close();

    const root = doc.getElementById("root");
    for (const { title, generator } of components) {
      const panel = newElement("div", { className: "panel panel-default" }, [
        newElement("div", { className: "panel-heading", textContent: title }),
        newElement("div", { className: "panel-body" }, [generator(win)]),
      ]);
      root.appendChild(panel);
    }
  },
};

export default settings;