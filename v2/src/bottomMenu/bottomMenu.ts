import BottomMenuTab from "./BottomMenuTab";

export default interface BottomMenu {
  selectTab(tabId: string): void;
  addTab(tabId: string, tabLabel: string, paneContent: Node, options?: any): BottomMenuTab;
  show(): void;
  toggle(): void;
}