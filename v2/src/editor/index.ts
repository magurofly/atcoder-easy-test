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
  private _element: HTMLTextAreaElement;

  constructor(lang: string) {
    this._element = document.createElement("textarea");
    this._element.style.fontFamily = "monospace";
    this._element.style.width = "100%";
    this._element.style.minHeight = "5em";
  }

  get element(): HTMLElement {
    return this._element;
  }

  get sourceCode(): string {
    return this._element.value;
  }
  
  set sourceCode(sourceCode: string) {
    this._element.value = sourceCode;
  }

  setLanguage(lang: string) {
  }
};