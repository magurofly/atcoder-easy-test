import bottomMenu from "./bottomMenu.html";
import style from "./style.html";

declare const style: HTMLStyleElement;
declare const bottomMenu: HTMLDivElement;

unsafeWindow.document.head.appendChild(style);
unsafeWindow.document.getElementById("main-div").appendChild(bottomMenu);

const bottomMenuKey = bottomMenu.querySelector("#bottom-menu-key") as HTMLButtonElement;
const bottomMenuTabs = bottomMenu.querySelector("#bottom-menu-tabs") as HTMLUListElement;
const bottomMenuContents = bottomMenu.querySelector("#bottom-menu-contents") as HTMLDivElement;

// メニューのリサイズ
{
  let resizeStart = null;
  const onStart = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const pageY = event.pageY;
    if (target.id != "bottom-menu-tabs") return;
    resizeStart = { y: pageY, height: bottomMenuContents.getBoundingClientRect().height };
  };
  const onMove = (event: MouseEvent) => {
    if (!resizeStart) return;
    event.preventDefault();
    bottomMenuContents.style.height = `${ resizeStart.height - (event.pageY - resizeStart.y) }px`;
  };
  const onEnd = (event) => {
    resizeStart = null;
  };
  bottomMenuTabs.addEventListener("mousedown", onStart);
  bottomMenuTabs.addEventListener("mousemove", onMove);
  bottomMenuTabs.addEventListener("mouseup", onEnd);
  bottomMenuTabs.addEventListener("mouseleave", onEnd);
}

interface TabController {
  close(): void;
  show(): void;
  set color(color: string);
}

let tabs = new Set();

/** 下メニューの操作 */
const menuController = {
  /** 下メニューにタブを追加する */
  addTab(tabId: string, tabLabel: string, paneContent: Node, options = {}): TabController {
    console.log(`AtCoder Easy Test: addTab: ${tabLabel} (${tabId})`, paneContent);

    // タブを追加
    const tab = document.createElement("a");
    tab.id = `bottom-menu-tab-${tabId}`;
    tab.href = "#";
    tab.dataset.target = `#bottom-menu-pane-${tabId}`;
    tab.dataset.toggle = "tab";
    tab.addEventListener("click", event => {
      event.preventDefault();
      (tab as any).tab("show"); // Bootstrap 3
    });
    const tabLi = document.createElement("li");
    tabLi.appendChild(tab);
    bottomMenuTabs.appendChild(tabLi);

    // 内容を追加
    const pane = document.createElement("div");
    pane.className = "tab-pane";
    pane.id = `bottom-menu-pane-${tabId}`;
    pane.appendChild(paneContent);
    bottomMenuContents.appendChild(pane);

    const controller: TabController = {
      close() {
        bottomMenuTabs.removeChild(tabLi);
        bottomMenuContents.removeChild(pane);
        tabs.delete(tab);
        if (tabLi.classList.contains("active") && tabs.size > 0) {
          tabs.values().next().value.tab("show");
        }
      },
      show() {
        menuController.show();
        (tab as any).tab("show"); // Bootstrap 3
      },
      set color(color: string) {
        tab.style.backgroundColor = color;
      },
    };

    return controller;
  },

  /** 下メニューを表示する */
  show() {
    if (bottomMenuKey.classList.contains("collapsed")) bottomMenuKey.click();
  },

  /** 下メニューの表示/非表示を切り替える */
  toggle() {
    bottomMenuKey.click();
  },
};

console.info("AtCoder Easy Test: bottomMenu OK");

export default menuController;