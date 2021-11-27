import config from "./config";
import settings from "./settings";
import { newElement, ObservableValue } from "./util";

const version = {
  currentProperty: new ObservableValue("$_ATCODER_EASY_TEST_VERSION"),
  get current(): string {
    return this.currentProperty.value;
  },
  latestProperty: new ObservableValue(config.get("version.latest", "$_ATCODER_EASY_TEST_VERSION")),
  get latest(): string {
    return this.latestProperty.value;
  },
  lastCheckProperty: new ObservableValue(config.get("version.lastCheck", 0)),
  get lastCheck(): number {
    return this.lastCheckProperty.value;
  },
  get hasUpdate(): boolean {
    return this.compare(this.current, this.latest) < 0;
  },
  compare(a: string, b: string): number {
    const x = a.split(".").map((s: string) => parseInt(s, 10));
    const y = b.split(".").map((s: string) => parseInt(s, 10));
    for (let i = 0; i < 3; i++) {
      if (x[i] < y[i]) {
        return -1;
      } else if (x[i] > y[i]) {
        return 1;
      }
    }
    return 0;
  },
  async checkUpdate(force: boolean = false): Promise<string> {
    const now = Date.now();
    if (!force && now - version.lastCheck < config.get("version.checkInterval", aDay)) {
      return this.current;
    }
    const packageJson = await fetch("https://raw.githubusercontent.com/magurofly/atcoder-easy-test/main/v2/package.json").then(r => r.json());
    console.log(packageJson);
    const latest = packageJson["version"] as string;
    this.latestProperty.value = latest;
    config.set("version.latest", latest);
    this.lastCheckProperty.value = now;
    config.set("version.lastCheck", now);
    return latest;
  },
};

// 更新チェック
const aDay = 24 * 60 * 60 * 1e3;
config.registerCount("version.checkInterval", aDay, "Interval [ms] of checking for new version");
const interval: number = config.get("version.checkInterval", aDay);
setInterval(() => {
  version.checkUpdate(false);
}, 60e3);

settings.add("version", (win) => {
  const root = newElement("div");

  const text = win.document.createTextNode.bind(win.document);
  const textAuto = (property) => {
    const t = text(property.value);
    property.addListener(value => {
      t.textContent = value;
    })
    return t;
  };

  const tCurrent = textAuto(version.currentProperty);
  const tLatest = textAuto(version.latestProperty);
  const tLastCheck = textAuto(version.lastCheckProperty.map(time => new Date(time).toLocaleString()));

  root.appendChild(newElement("p", {}, [
    text("AtCoder Easy Test v"),
    tCurrent,
  ]));

  const updateButton = newElement("a", {
    className: "btn btn-info",
    textContent: "Install",
    href: "https://github.com/magurofly/atcoder-easy-test/raw/main/v2/atcoder-easy-test.user.js",
    target: "_blank",
  });
  const showButton = () => {
    if (version.hasUpdate) updateButton.style.display = "inline";
    else updateButton.style.display = "none";
  };
  showButton();
  version.lastCheckProperty.addListener(showButton);

  root.appendChild(newElement("p", {}, [
    text("Latest: v"),
    tLatest,
    text(" (Last Check: "),
    tLastCheck,
    text(") "),
    updateButton,
  ]));

  root.appendChild(newElement("p", {}, [
    newElement("a", {
      className: "btn btn-primary",
      textContent: "Check Update",
      onclick() {
        version.checkUpdate(true);
      },
    }),
  ]));

  return root;
});

export default version;