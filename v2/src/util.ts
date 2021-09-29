export function html2element(html: string): Node {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstChild;
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
