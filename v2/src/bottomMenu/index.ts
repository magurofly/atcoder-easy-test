import { html2element } from "../util";
import BottomMenu from "./bottomMenu";
import BottomMenuTab from "./BottomMenuTab";

import hBottomMenu from "./bottomMenu.html";
import hStyle from "./style.html";
import pSite from "../site";

async function init(): Promise<BottomMenu> {
const site = await pSite;

const style = html2element(hStyle) as HTMLStyleElement;
const bottomMenu = html2element(hBottomMenu) as HTMLDivElement;

unsafeWindow.document.head.appendChild(style);
site.bottomMenuContainer.appendChild(bottomMenu);

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
  const onEnd = () => {
    resizeStart = null;
  };
  bottomMenuTabs.addEventListener("mousedown", onStart);
  bottomMenuTabs.addEventListener("mousemove", onMove);
  bottomMenuTabs.addEventListener("mouseup", onEnd);
  bottomMenuTabs.addEventListener("mouseleave", onEnd);
}

let tabs = new Set();
let selectedTab: string | null = null;

/** 下メニューの操作
 * 下メニューはいくつかのタブからなる。タブはそれぞれ tabId, ラベル, 中身を持っている。
 */
const menuController: BottomMenu = {
  /** タブを選択 */
  selectTab(tabId: string) {
    const tab = site.jQuery(`#bottom-menu-tab-${tabId}`);
    if (tab && tab[0]) {
      tab.tab("show"); // Bootstrap 3
      selectedTab = tabId;
    }
  },

  /** 下メニューにタブを追加する */
  addTab(tabId: string, tabLabel: string, paneContent: Node, options: { closeButton?: boolean } = {}): BottomMenuTab {
    console.log(`AtCoder Easy Test: addTab: ${tabLabel} (${tabId})`, paneContent);

    // タブを追加
    const tab = document.createElement("a");
    tab.textContent = tabLabel;
    tab.id = `bottom-menu-tab-${tabId}`;
    tab.href = "#";
    tab.dataset.id = tabId;
    tab.dataset.target = `#bottom-menu-pane-${tabId}`;
    tab.dataset.toggle = "tab";
    tab.addEventListener("click", event => {
      event.preventDefault();
      menuController.selectTab(tabId);
    });
    tabs.add(tab);
    const tabLi = document.createElement("li");
    tabLi.appendChild(tab);
    bottomMenuTabs.appendChild(tabLi);

    // 内容を追加
    const pane = document.createElement("div");
    pane.className = "tab-pane";
    pane.id = `bottom-menu-pane-${tabId}`;
    pane.appendChild(paneContent);
    bottomMenuContents.appendChild(pane);

    const controller: BottomMenuTab = {
      get id() {
        return tabId;
      },
      close() {
        bottomMenuTabs.removeChild(tabLi);
        bottomMenuContents.removeChild(pane);
        tabs.delete(tab);
        if (selectedTab == tabId) {
          selectedTab = null;
          if (tabs.size > 0) {
            menuController.selectTab(tabs.values().next().value.dataset.id);
          }
        }
      },
      show() {
        menuController.show();
        menuController.selectTab(tabId);
      },
      set color(color: string) {
        tab.style.backgroundColor = color;
      },
    };

    // 閉じるボタン
    if (options.closeButton) {
      const btn = document.createElement("a");
      btn.className = "bottom-menu-btn-close btn btn-link glyphicon glyphicon-remove";
      btn.addEventListener("click", () => {
        controller.close();
      });
      tab.appendChild(btn);
    }

    // 選択されているタブがなければ選択
    if (!selectedTab) menuController.selectTab(tabId);

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

return menuController;

};

export default init;