const eventListeners = {};

const events = {
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

export default events;