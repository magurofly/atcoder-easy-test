function getEditor(): Promise<any> {
  if (unsafeWindow["monaco"]) return Promise.resolve(unsafeWindow["monaco"]);
  return new Promise(done => {
    const doc = unsafeWindow.document;
    const loader = doc.createElement("script");
    loader.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs/loader.min.js";
    loader.onload = () => {
      unsafeWindow["require"].config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs",
        },
      });
      unsafeWindow["MonacoEnvironment"] = {
        getWorkerUrl: (workerId, label) => `data:text/javascript;charset=UTF-8,${encodeURIComponent(`
          self.MonacoEnvironment = {
            baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/'
          };
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs/base/worker/workerMain.js');
        `)}`,
      };
      unsafeWindow["require"](["vs/editor/editor.main"], () => {
        done(unsafeWindow["monaco"]);
      });
    };
    doc.head.appendChild(loader);
  });
}

const langMap = {
  "C": "c",
  "C++": "cpp",
  "C#": "csharp",
  // sorry no D
  // sorry no haskell
  "Java": "java",
  "Kotlin": "kotlin",
  // sorry no OCaml
  // sorry no Delphi
  "Pascal": "pascal",
  "Perl": "perl",
  "PHP": "php",
  "Python": "python",
  "Python3": "python",
  "Ruby": "ruby",
  "Rust": "rust",
  "Scala": "scala",
  "JavaScript": "javascript",
};

export default class Editor {
  private _element: HTMLElement;
  private _editor: Promise<any>;

  constructor(lang) {
    this._element = document.createElement("div");
    this._editor = getEditor().then(editor => editor.create(this._element, {
      value: "",
      language: langMap[lang] || "text",
    }));
  }

  get element(): HTMLElement {
    return this._element;
  }

  async getSourceCode(): Promise<string> {
    return (await this._editor).getValue();
  }
  
  async setSourceCode(sourceCode: string) {
    (await this._editor).setValue(sourceCode);
  }

  async setLanguage(lang: string) {
    (await getEditor()).editor.setModelLanguage((await this._editor).getModel(), langMap[lang]);
  }
};