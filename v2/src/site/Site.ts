import TestCase from "../TestCase";
import { ObservableValue } from "../util";

export default interface Site {
  get name(): string;
  get sourceCode(): string;
  set sourceCode(sourceCode: string);
  get language(): ObservableValue<string>;
  submit(): void;
  get testButtonContainer(): HTMLElement;
  get sideButtonContainer(): HTMLElement;
  get bottomMenuContainer(): HTMLElement;
  get resultListContainer(): HTMLElement;
  get testCases(): TestCase[];
}