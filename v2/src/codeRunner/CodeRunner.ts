import Options from "./Options";
import Result from "./Result";

export default abstract class CodeRunner {
  get label(): string {
    return (this as any)._label;
  }

  constructor(label: string, site: string) {
    (this as any)._label = `${label} [${site}]`;
  }
  
  async test(sourceCode: string, input: string, expectedOutput: string | null, options: Options): Promise<Result> {
    let result: Result = { status: "IE", input };
    try {
      result = await this.run(sourceCode, input);
    } catch (e) {
      result.error = e.toString();
      return result;
    }
    if (expectedOutput != null) result.expectedOutput = expectedOutput;
    if (result.status != "OK" || typeof expectedOutput != "string") return result;
    let output = result.output || "";
    
    if (options.trim) {
      expectedOutput = expectedOutput.trim();
      output = output.trim();
    }
    
    let equals: (x: string, y: string) => boolean = (x, y) => x === y;
    
    if (options.allowableError) {
      const floatPattern = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
      const superEquals = equals;
      equals = (x, y) => {
        if (floatPattern.test(x) && floatPattern.test(y)) return Math.abs(parseFloat(x) - parseFloat(y)) <= options.allowableError;
        return superEquals(x, y);
      };
    }
    
    if (options.split) {
      const superEquals = equals;
      equals = (x, y) => {
        const xs = x.split(/\s+/);
        const ys = y.split(/\s+/);
        if (xs.length != ys.length) return false;
        const len = xs.length;
        for (let i = 0; i < len; i++) {
          if (!superEquals(xs[i], ys[i])) return false;
        }
        return true;
      }
    }

    result.status = equals(output, expectedOutput) ? "AC" : "WA";

    return result;
  }
  
  abstract run(sourceCode: string, input: string): Promise<Result>;
};