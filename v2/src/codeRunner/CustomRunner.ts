import CodeRunner from "./CodeRunner";
import Result from "./Result";
import Options from "./Options";

export default class CustomRunner extends CodeRunner {
  run: (sourceCode: string, input: string, options?: Options) => Promise<Result>;

  constructor(label: string, run: (sourceCode: string, input: string) => Promise<Result>) {
    super(label, "Browser");
    this.run = run;
  }
};