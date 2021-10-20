import TestCase from "../TestCase";
import { ObservableValue } from "../util";

async function init() {
  if (location.host != "codeforces.com") throw "not Codeforces";
  //TODO: m1.codeforces.com, m2.codeforces.com, m3.codeforces.com に対応する

  const doc = unsafeWindow.document;
  const eLang = doc.querySelector<HTMLSelectElement>("select[name='programTypeId']");

  const bootstrapCSS = doc.createElement("link");
  bootstrapCSS.rel = "stylesheet";
  bootstrapCSS.href = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css";
  doc.head.appendChild(bootstrapCSS);

  await new Promise(done => {
    const bootstrapJQuery = doc.createElement("script");
    bootstrapJQuery.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js";
    bootstrapJQuery.onload = async () => {
      const bootstrapJS = await fetch("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min.js").then(r => r.text());
      Function("$, jQuery", bootstrapJS)(unsafeWindow.$, unsafeWindow.$);
      done(unsafeWindow.$.noConflict());
    };
    doc.body.appendChild(bootstrapJQuery);
  });

  const langMap = {
    43: "C C11 GCC 5.1.0",
    52: "C++ C++17 Clang++",
    50: "C++ C++14 G++ 6.4.0",
    54: "C++ C++17 G++ 7.3.0",
    59: "C++ Microsoft Visual C++ 2017",
    61: "C++ C++17 9.2.0 (64 bit, msys 2)",
    65: "C# 8, .NET Core 3.1",
    9: "C# Mono 6.8",
    28: "D DMD32 v2.091.0",
    32: "Go 1.15.6",
    12: "Haskell GHC 8.10.1",
    60: "Java 11.0.6",
    36: "Java 1.8.0_241",
    48: "Kotlin 1.5.31",
    19: "OCaml 4.02.1",
    3: "Delphi 7",
    4: "Pascal Free Pascal 3.0.2",
    51: "Pascal PascalABC.NET 3.4.1",
    13: "Perl 5.20.1",
    6: "PHP 7.2.13",
    7: "Python 2.7.18",
    31: "Python3 3.8.10",
    40: "Python PyPy2 2.7 (7.3.0)",
    41: "Python3 PyPy3 3.7 (7.3.0)",
    67: "Ruby 3.0.0",
    49: "Rust 1.49.0",
    20: "Scala 2.12.8",
    34: "JavaScript V8 4.8.0",
    55: "JavaScript Node.js 12.6.3",
  };

  const language = new ObservableValue(langMap[eLang.value]);
  eLang.addEventListener("change", () => {
    language.value = langMap[eLang.value];
  });

  let _sourceCode = "";
  const eFile = doc.querySelector<HTMLFormElement>(".submitForm").elements["sourceFile"];
  eFile.addEventListener("change", async () => {
    if (eFile.files[0]) {
      _sourceCode = await eFile.files[0].text();
    }
  });

  return {
    name: "Codeforces",
    language,
    get sourceCode(): string {
      return _sourceCode;
    },
    set sourceCode(sourceCode: string) {
      const container = new DataTransfer();
      container.items.add(new File([sourceCode], "prog.txt", { type: "text/plain" }))
      const eFile = doc.querySelector<HTMLFormElement>(".submitForm").elements["sourceFile"];
      eFile.files = container.files;
      _sourceCode = sourceCode;
      //TODO: 追加した提出欄に設定
    },
    submit(): void {
      doc.querySelector<HTMLElement>(`#submit_form input[type="submit"]`).click();
    },
    get testButtonContainer(): HTMLElement {
      return doc.querySelector(".submitForm");
    },
    get sideButtonContainer(): HTMLElement {
      return doc.querySelector(".submitForm");
    },
    get bottomMenuContainer(): HTMLElement {
      return doc.body;
    },
    get resultListContainer(): HTMLElement {
      return doc.querySelector("#pageContent");
    },
    get testCases(): TestCase[] {
      return [... doc.querySelectorAll(".sample-test")].map((e, i) => ({
        title: `Sample ${i + 1}`,
        input: e.querySelector(".input pre").textContent,
        output: e.querySelector(".output pre").textContent,
        anchor: e.querySelector(".input .title"),
      }));
    },
  };
}

export default init;