import config from "./config";
import settings from "./settings";
import { newElement } from "./util";

interface SavedCode {
  path: string,
  code: string,
}

config.registerCount("codeSaver.limit", 10, "Max number to save codes");

const codeSaver = {
  get(): SavedCode[] {
    // `json` は、ソースコード文字列またはJSON文字列
    let json = unsafeWindow.localStorage.AtCoderEasyTest$lastCode as string;
    let data: SavedCode[] = [];
    try {
      if (typeof json == "string") {
        data.push(...JSON.parse(json) as SavedCode[]);
      } else {
        data = [];
      }
    } catch (e) {
      data.push({
        path: unsafeWindow.localStorage.AtCoderEasyTset$lastPage,
        code: json,
      });
    }
    return data;
  },

  set(data: SavedCode[]) {
    unsafeWindow.localStorage.AtCoderEasyTest$lastCode = JSON.stringify(data);
  },

  save(code: string) {
    let data = codeSaver.get();
    const idx = data.findIndex(({path}) => path == location.pathname);
    if (idx != -1) data.splice(idx, idx + 1);
    data.push({
        path: location.pathname,
        code,
    });
    while (data.length > config.get("codeSaver.limit", 10)) data.shift();
    codeSaver.set(data);
  },

  restore(): Promise<string> {
    const data = codeSaver.get();
    const idx = data.findIndex(({path}) => path == location.pathname);
    if (idx == -1 || !(data[idx] instanceof Object)) return Promise.reject(`No saved code found for ${location.pathname}`);
    return Promise.resolve(data[idx].code);
  }
};

settings.add(`codeSaver (${location.host})`, (win) => {
  const root = newElement<HTMLTableElement>("table", { className: "table" }, [
    newElement("thead", {}, [
      newElement("tr", {}, [
        newElement("th", { textContent: "path" }),
        newElement("th", { textContent: "code" }),
      ]),
    ]),
    newElement("tbody"),
  ]);
  root.tBodies
  for (const savedCode of codeSaver.get()) {
    root.tBodies[0].appendChild(newElement("tr", {}, [
      newElement("td", { textContent: savedCode.path }),
      newElement("td", {}, [
        newElement("textarea", {
          rows: 1,
          cols: 30,
          textContent: savedCode.code,
        }),
      ]),
    ]));
  }
  return root;
});

export default codeSaver;