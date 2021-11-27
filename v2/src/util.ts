export function buildParams(data: { [key: string]: string }): string {
  return Object.entries(data).map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&");
}

export function sleep(ms: number): Promise<void> {
  return new Promise(done => setTimeout(done, ms));
}

export function doneOrFail<T>(p: Promise<T>): Promise<void> {
  return p.then(() => Promise.resolve(), () => Promise.resolve());
}

export function html2element(html: string): Node {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstChild;
}

export function newElement<T extends HTMLElement>(tagName: string, attrs: any = {}, children = []): T {
  const e = document.createElement(tagName) as T;
  for (const [key, value] of Object.entries(attrs)) {
    if (key == "style") {
      for (const [propKey, propValue] of Object.entries(value)) {
        e.style[propKey] = propValue;
      }
    } else {
      e[key] = value;
    }
  }
  for (const child of children) {
    e.appendChild(child);
  }
  return e;
}

export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
    replace(/x/g, () => "0123456789abcdef"[Math.random() * 16 | 0]).
    replace(/y/g, () => "89ab"[Math.random() * 4 | 0]);
}

export async function loadScript(src: string, ctx = null, env: any = {}): Promise<void> {
  const js = await fetch(src).then(res => res.text());
  const keys = [];
  const values = [];
  for (const [key, value] of Object.entries(env)) {
    keys.push(key);
    values.push(value);
  }
  unsafeWindow["Function"](keys.join(), js).apply(ctx, values);
}

const eventListeners = {};

export const events = {
  on(name: string, listener: () => void) {
    const listeners = (name in eventListeners ? eventListeners[name] : eventListeners[name] = []);
    listeners.push(listener);
  },

  trig(name: string) {
    if (name in eventListeners) {
      for (const listener of eventListeners[name]) listener();
    }
  },
};

export class ObservableValue<T> {
  private _value: T;
  private _listeners: Set<(value: T) => void>;

  constructor(value: T) {
    this._value = value;
    this._listeners = new Set();
  }

  get value(): T {
    return this._value;
  }

  set value(value: T) {
    this._value = value;
    for (const listener of this._listeners) listener(value);
  }

  addListener(listener: (value: T) => void) {
    this._listeners.add(listener);
    listener(this._value);
  }

  removeListener(listener: (value: T) => void) {
    this._listeners.delete(listener);
  }

  map<U>(f: (value: T) => U): ObservableValue<U> {
    const y = new ObservableValue(f(this.value));
    this.addListener(x => {
      y.value = f(x);
    });
    return y;
  }
}