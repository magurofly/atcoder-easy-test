import bottomMenu from "./bottomMenu.html";
import bottomMenuKey from "./bottomMenuKey.html";
import bottomMenuTabs from "./bottomMenuTabs.html";
import bottomMenuContents from "./bottomMenuContents.html";

const tabs = new Set();

const style = document.createElement("style");
style.textContent = `

#bottom-menu-wrapper {
  background: transparent;
  border: none;
  pointer-events: none;
  padding: 0;
}

#bottom-menu-wrapper>.container {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0;
}

#bottom-menu-wrapper>.container>.navbar-header {
  float: none;
}

#bottom-menu-key {
  display: block;
  float: none;
  margin: 0 auto;
  padding: 10px 3em;
  border-radius: 5px 5px 0 0;
  background: #000;
  opacity: 0.5;
  color: #FFF;
  cursor: pointer;
  pointer-events: auto;
  text-align: center;
}

@media screen and (max-width: 767px) {
  #bottom-menu-key {
    opacity: 0.25;
  }
}

#bottom-menu-key.collapsed:before {
  content: "\\e260";
}

#bottom-menu-tabs {
  padding: 3px 0 0 10px;
  cursor: n-resize;
}

#bottom-menu-tabs a {
  pointer-events: auto;
}

#bottom-menu {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  max-height: unset;
}

#bottom-menu.collapse:not(.in) {
  display: none !important;
}

#bottom-menu-tabs>li>a {
  background: rgba(150, 150, 150, 0.5);
  color: #000;
  border: solid 1px #ccc;
  filter: brightness(0.75);
}

#bottom-menu-tabs>li>a:hover {
  background: rgba(150, 150, 150, 0.5);
  border: solid 1px #ccc;
  color: #111;
  filter: brightness(0.9);
}

#bottom-menu-tabs>li.active>a {
  background: #eee;
  border: solid 1px #ccc;
  color: #333;
  filter: none;
}

.bottom-menu-btn-close {
  font-size: 8pt;
  vertical-align: baseline;
  padding: 0 0 0 6px;
  margin-right: -6px;
}

#bottom-menu-contents {
  padding: 5px 15px;
  max-height: 50vh;
  overflow-y: auto;
}

#bottom-menu-contents .panel {
  color: #333;
}

`;
document.head.appendChild(style);
bottomMenu.appendChild(bottomMenuTabs);
bottomMenu.appendChild(bottomMenuContents);
$(`<div id="bottom-menu-wrapper" class="navbar navbar-default navbar-fixed-bottom">`)
.append($(`<div class="container">`)
.append(
  $(`<div class="navbar-header">`).append(bottomMenuKey),
  bottomMenu))
  .appendTo("#main-div");
  
  let resizeStart = null;
  bottomMenuTabs.on({
    mousedown({target, pageY}) {
      if (target.id != "bottom-menu-tabs") return;
      resizeStart = {y: pageY, height: bottomMenuContents.height()};
    },
    mousemove(e) {
      if (!resizeStart) return;
      e.preventDefault();
      bottomMenuContents.height(resizeStart.height - (e.pageY - resizeStart.y));
    },
  });
  document.addEventListener("mouseup", () => { resizeStart = null; });
  document.addEventListener("mouseleave", () => { resizeStart = null; });
});

const menuController = {
  addTab(tabId, tabLabel, paneContent, options = {}) {
    console.log("addTab: %s (%s)", tabLabel, tabId, paneContent);
    const tab = $(`<a id="bottom-menu-tab-${tabId}" href="#" data-target="#bottom-menu-pane-${tabId}" data-toggle="tab">`)
    .click(e => {
      e.preventDefault();
      tab.tab("show");
    })
    .append(tabLabel);
    const tabLi = $(`<li>`).append(tab).appendTo(bottomMenuTabs);
    const pane = $(`<div class="tab-pane" id="bottom-menu-pane-${tabId}">`).append(paneContent).appendTo(bottomMenuContents);
    console.dirxml(bottomMenuContents);
    const controller = {
      close() {
        tabLi.remove();
        pane.remove();
        tabs.delete(tab);
        if (tabLi.hasClass("active") && tabs.size > 0) {
          tabs.values().next().value.tab("show");
        }
      },
      
      show() {
        menuController.show();
        tab.tab("show");
      },
      
      set color(color) {
        tab.css("background-color", color);
      },
    };
    tabs.add(tab);
    if (options.closeButton) tab.append($(`<a class="bottom-menu-btn-close btn btn-link glyphicon glyphicon-remove">`).click(() => controller.close()));
    if (options.active || tabs.size == 1) pane.ready(() => tab.tab("show"));
    return controller;
  },
  
  show() {
    if (bottomMenuKey.hasClass("collapsed")) bottomMenuKey.click();
  },
  
  toggle() {
    bottomMenuKey.click();
  },
};

console.info("bottomMenu OK");

export default menuController;