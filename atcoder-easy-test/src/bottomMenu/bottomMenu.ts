import TabController from "./TabController";

export default interface BottomMenu {
  selectTab(tabId: string): void;
  addTab(tabId: string, tabLabel: string, paneContent: Node, options: any): TabController;
  show(): void;
  toggle(): void;
}