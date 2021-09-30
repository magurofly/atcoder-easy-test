import { ObservableValue } from "./util";

let data: { [key: string]: string } = {};

function toString() {
  return JSON.stringify(data);
}

function save() {
  localStorage.setItem("AtCoderEasyTest", toString());
}

function load() {
  if ("AtCoderEasyTest" in localStorage) {
    data = JSON.parse(localStorage.getItem("AtCoderEasyTest"));
  }
}

load();

const config = {
  get(key: string, defaultValue: string = ""): string {
    if (!(key in data)) config.set(key, defaultValue);
    return data[key];
  },
  set(key: string, value: string): void {
    data[key] = value;
    save();
  },
  has(key: string): boolean {
    return key in data;
  },
  getAsJSON<T = null>(key: string, defaultValue: T = null): T {
    if (!(key in data)) config.setAsJSON(key, defaultValue);
    return JSON.parse(data[key]);
  },
  setAsJSON<T>(key: string, value: T): void {
    config.set(key, JSON.stringify(value));
  },
  save,
  load,
  toString,
};

export default config;