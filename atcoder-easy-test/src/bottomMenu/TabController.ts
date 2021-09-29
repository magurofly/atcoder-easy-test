export default interface TabController {
  get id(): string;
  close(): void;
  show(): void;
  set color(color: string);
}