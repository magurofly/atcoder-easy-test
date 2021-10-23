import config from "../config";

import hPage from "./page.html";

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

    const bindCheckbox = (key: string, defaultValue: boolean) => {
      const element = doc.getElementById(key) as HTMLInputElement;
      element.checked = config.get(key, defaultValue);
      element.addEventListener("change", () => {
        config.set(key, element.checked);
      });
    };

    bindCheckbox("useKeyboardShortcut", true);
    bindCheckbox("codeforcesShowEditor", false);
  }
}

export default settings;