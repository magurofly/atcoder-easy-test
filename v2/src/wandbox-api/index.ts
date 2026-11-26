import config from "../config";
import WandboxCppRunner from "../codeRunner/WandboxCppRunner";
import WandboxRunner from "../codeRunner/WandboxRunner";

// https://github.com/melpon/wandbox/blob/master/proto/kennel.proto
// 同等の定義をすると大変なので、一旦肝要な部分だけを定義する。
interface CompilerInfo {
  name: string;
  language: string;
  version: string;
  switches: Switch[];
}

interface Switch {
  type: string;
  name: string;
  "display-name": string | null;
}

// 設定項目を定義
config.registerCount("wandboxAPI.cacheLifetime", 24 * 60 * 60 * 1000, "lifetime [ms] of Wandbox compiler list cache");

async function fetchWandboxCompilers() {
  // キャッシュが有効な場合はキャッシュを使う
  const cached = config.get("wandboxAPI.cachedCompilerList", { value: null, lastModified: -Infinity });
  if (Date.now() - cached.lastModified <= config.get("wandboxAPI.cacheLifetime", 24 * 60 * 60 * 1000)) {
    return cached.value;
  }

  // キャッシュが無効な場合は fetch
  const response = await fetch("https://wandbox.org/api/list.json");
  const compilers: CompilerInfo[] = await response.json();

  config.set("wandboxAPI.cachedCompilerList", { value: compilers, lastModified: Date.now() });
  config.save();

  return compilers;
}

// Wandbox の Python は language がすべて "Python"。
// CPython の version は "3.13.18"、PyPy の version は "8.0.1 cpython-3.12.15"。
// version に "python-3." が含まれるかだけを見ると、PyPy だけが Python3 になり CPython が漏れる。
function isPython3Compiler(compiler: CompilerInfo): boolean {
  if (/^3\./.test(compiler.version)) return true;
  if (/python-3\./.test(compiler.version)) return true;
  // version が空の cpython-head は python3
  if (compiler.name === "cpython-head") return true;
  return /^(?:cpython|pypy)-3\./.test(compiler.name);
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
      compiler.language + " " + compiler.name + " + ACL",
      {
        "compiler-option-raw": "-I.",
        options: optimizationOption,
      }
    );
  } else {
    return new WandboxRunner(
      compiler.name,
      compiler.language + " " + compiler.name,
      {
        options: optimizationOption,
      }
    );
  }
}

export { fetchWandboxCompilers, isPython3Compiler, toRunner };
