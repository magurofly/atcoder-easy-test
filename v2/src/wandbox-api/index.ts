
import WandboxCppRunner from "../codeRunner/WandboxCppRunner";
import WandboxRunner from "../codeRunner/WandboxRunner";

// https://github.com/melpon/wandbox/blob/master/proto/kennel.proto
// 同等の定義をすると大変なので、一旦肝要な部分だけを定義する。
interface CompilerInfo {
  name: string;
  language: string;
}

async function fetchWandboxCompilers() {
  const response = await fetch("https://wandbox.org/api/list.json");
  const compilers: CompilerInfo[] = await response.json();
  return compilers;
}

function toRunner(compiler: CompilerInfo) {
  if (compiler.language == "C++") {
    return new WandboxCppRunner(
      compiler.name,
      compiler.language + " " + compiler.name + " + ACL (from Wandbox API)",
      {
        "compiler-option-raw": "-I.",
      }
    );
  } else {
    return new WandboxRunner(
      compiler.name,
      compiler.language + " " + compiler.name + " (from Wandbox API)"
    );
  }
}

export { fetchWandboxCompilers, toRunner };
