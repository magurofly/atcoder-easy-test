import Result from "./Result";
import WandboxRunner from "./WandboxRunner";

export default class WandboxCppRunner extends WandboxRunner {
  async run(sourceCode: string, input: string): Promise<Result> {
    // ACL を結合する
    const ACLBase = "https://cdn.jsdelivr.net/gh/atcoder/ac-library/";
    const files = new Map();
    const includeHeader = async source => {
      const pattern = /^#\s*include\s*[<"]atcoder\/([^>"]+)[>"]/gm;
      const loaded = [];
      let match: RegExpExecArray;
      while (match = pattern.exec(source)) {
        const file = "atcoder/" + match[1];
        if (files.has(file)) continue;
        files.set(file, null);
        loaded.push([file, fetch(ACLBase + file, { mode: "cors", cache: "force-cache", }).then(r => r.text())]);
      }
      const included = await Promise.all(loaded.map(async ([file, r]) => {
        const source = await r;
        files.set(file, source);
        return source;
      }));
      for (const source of included) {
        await includeHeader(source);
      }
    };
    await includeHeader(sourceCode);
    const codes = [];
    for (const [file, code] of files) {
      codes.push({ file, code, });
    }
    
    const options = this.getOptions(sourceCode, input);
    return await this.request(Object.assign({
        compiler: this.name,
        code: sourceCode,
        stdin: input,
        codes,
    }, options));
  }
}