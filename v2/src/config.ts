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

load();

/** プロパティ名は camelCase にすること */
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
};

export default config;