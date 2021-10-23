import config from "../config";
import { newElement } from "../util";

import hPage from "./page.html";

interface Option<T> {
  type: "checkbox",
  key: string,
  defaultValue: T,
  description: string,
}

const options: Option<any>[] = [];

const settings = {
  /** 設定ページを開く
   * クリックなどのイベント時にしか正しく実行できない
   */
  open() {
    const win = window.open("about:blank");
    const doc = win.document;
    doc.open();
    doc.write(hPage);
    doc.close();

    const root = doc.getElementById("options");

    for (const { type, key, defaultValue, description } of options) {
      switch (type) {
        case "checkbox": {
          const container = newElement("div", { className: "checkbox" });
          root.appendChild(container);
          const label = newElement("label");
          container.appendChild(label);
          const element = newElement<HTMLInputElement>("input", {
            type: "checkbox",
            checked: config.get(key, defaultValue),
          });
          element.addEventListener("change", () => {
            config.set(key, element.checked);
          });
          label.appendChild(element);
          label.appendChild(document.createTextNode(description));
          break;
        }
        default:
          throw new TypeError(`AtCoderEasyTest.setting: undefined option type ${type} for ${key}`);
      }
    }
  },

  /** 設定項目を登録 */
  registerFlag(key: string, defaultValue: any, description: string) {
    options.push({
      type: "checkbox",
      key,
      defaultValue,
      description,
    })
  }
}

export default settings;