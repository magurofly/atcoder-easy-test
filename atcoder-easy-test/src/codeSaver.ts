interface SavedCode {
  path: string,
  code: string,
}

const codeSaver = {
  LIMIT: 10,

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
    while (data.length > codeSaver.LIMIT) data.shift();
    codeSaver.set(data);
  },

  restore(): Promise<string> {
    const data = codeSaver.get();
    const idx = data.findIndex(({path}) => path == location.pathname);
    if (idx == -1 || !(data[idx] instanceof Object)) return Promise.reject(`No saved code found for ${location.pathname}`);
    return Promise.resolve(data[idx].code);
  }
};

export default codeSaver;