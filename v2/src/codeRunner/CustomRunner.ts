import CodeRunner from "./CodeRunner";
import Result from "./Result";

export default class CustomRunner extends CodeRunner {
  run: (sourceCode: string, input: string) => Promise<Result>;

  constructor(label: string, run: (sourceCode: string, input: string) => Promise<Result>) {
    super(label, "Browser");
    this.run = run;
  }
};