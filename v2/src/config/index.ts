import { newElement, uuid } from "../util";
import settings from "../settings";

interface Option<T> {
  type: "flag" | "count" | "text",
  key: string,
  defaultValue: T,
  description: string,
}

const options: Option<any>[] = [];

let data: { [key: string]: string } = {};

function toString() {
  return JSON.stringify(data);
}

function save() {
  GM_setValue("config", toString());
}

function load() {
  data = JSON.parse(GM_getValue("config") || "{}");
}

function reset() {
  data = {};
  save();
}

load();

// 設定ページ
settings.add("config", (win: Window) => {
  const root = newElement("form", { className: "form-horizontal" });

  options.sort((a, b) => {
    const x = a.key.split(".");
    const y = b.key.split(".");
    return x < y ? -1 : x > y ? 1 : 0;
  });

  for (const { type, key, defaultValue, description } of options) {
    const id = uuid();
    const control = newElement("div", { className: "col-sm-3 text-center" });
    const group = newElement("div", { className: "form-group" }, [
      control,
      newElement("label", {
        className: "col-sm-3",
        htmlFor: id,
        textContent: key,
        style: {
          fontFamily: "monospace",
        },
      }),
      newElement("label", {
        className: "col-sm-6",
        htmlFor: id,
        textContent: description,
      }),
    ]);
    root.appendChild(group);
    switch (type) {
      case "flag": {
        control.appendChild(newElement<HTMLInputElement>("input", {
          id,
          type: "checkbox",
          checked: config.get(key, defaultValue),
          onchange() {
            config.set(key, this.checked);
          },
        }));
        break;
      }
      case "count": {
        control.appendChild(newElement<HTMLInputElement>("input", {
          id,
          type: "number",
          min: "0",
          value: config.get(key, defaultValue),
          onchange() {
            config.set(key, +this.value);
          },
        }));
        break;
      }
      case "text": {
        control.appendChild(newElement<HTMLInputElement>("input", {
          id,
          type: "text",
          value: config.getString(key, defaultValue),
          onchange() {
            config.setString(key, this.value);
          },
        }));
        break;
      }
      default:
        throw new TypeError(`AtCoderEasyTest.setting: undefined option type ${type} for ${key}`);
    }
  }
  root.appendChild(newElement("button", {
    className: "btn btn-danger",
    textContent: "Reset",
    type: "button",
    onclick() {
      if (win.confirm("Configuration data will be cleared. Are you sure?")) {
        config.reset();
      }
    },
  }));
  return root;
});

const config = {
  getString(key: string, defaultValue: string = ""): string {
    if (!(key in data)) config.setString(key, defaultValue);
    return data[key];
  },
  setString(key: string, value: string): void {
    data[key] = value;
    save();
  },
  has(key: string): boolean {
    return key in data;
  },
  get<T = null>(key: string, defaultValue: T = null): T {
    if (!(key in data)) config.set(key, defaultValue);
    return JSON.parse(data[key]);
  },
  set<T>(key: string, value: T): void {
    config.setString(key, JSON.stringify(value));
  },
  save,
  load,
  toString,
  reset,

  /** 設定項目を登録 */
  registerFlag(key: string, defaultValue: boolean, description: string) {
    options.push({
      type: "flag",
      key,
      defaultValue,
      description,
    });
  },

  registerCount(key: string, defaultValue: number, description: string) {
    options.push({
      type: "count",
      key,
      defaultValue,
      description,
    });
  },

  registerText(key: string, defaultValue: string, description: string) {
    options.push({
      type: "text",
      key,
      defaultValue,
      description,
    });
  },
}

export default config;