import WandboxCppRunner from "../codeRunner/WandboxCppRunner";
import WandboxRunner from "../codeRunner/WandboxRunner";

// https://github.com/melpon/wandbox/blob/master/proto/kennel.proto
// 同等の定義をすると大変なので、一旦肝要な部分だけを定義する。
interface CompilerInfo {
  name: string;
  language: string;
  switches: Switch[];
}

interface Switch {
  type: string;
  name: string;
  "display-name": string | null;
}

async function fetchWandboxCompilers() {
  const response = await fetch("https://wandbox.org/api/list.json");
  const compilers: CompilerInfo[] = await response.json();
  return compilers;
}

function getOptimizationOption(compiler: CompilerInfo) {
  // Optimizationという名前のSwitchから、最適化のオプションを取得する
  return compiler.switches.find((sw) => sw["display-name"] === "Optimization")
    ?.name;
}

function toRunner(compiler: CompilerInfo) {
  const optimizationOption = getOptimizationOption(compiler);

  if (compiler.language == "C++") {
    return new WandboxCppRunner(
      compiler.name,
      compiler.language + " " + compiler.name + " + ACL (from Wandbox API)",
      {
        "compiler-option-raw": "-I.",
        options: optimizationOption,
      }
    );
  } else {
    return new WandboxRunner(
      compiler.name,
      compiler.language + " " + compiler.name + " (from Wandbox API)",
      {
        options: optimizationOption,
      }
    );
  }
}

export { fetchWandboxCompilers, toRunner };
