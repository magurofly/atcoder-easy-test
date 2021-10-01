import config from "../config";

import hPage from "./page.html";

function bindCheckbox(key: string, defaultValue: boolean, element: HTMLInputElement): void {
  element.checked = config.get(key, defaultValue);
  element.addEventListener("change", () => {
    config.set(key, element.checked);
  });
}

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

    bindCheckbox("useKeyboardShortcut", true, doc.getElementById("use-keyboard-shortcut") as HTMLInputElement);
  }
}

export default settings;