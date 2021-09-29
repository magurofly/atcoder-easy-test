export default interface BottomMenuTab {
  get id(): string;
  close(): void;
  show(): void;
  set color(color: string);
}