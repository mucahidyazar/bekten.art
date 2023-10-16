export const eventManager = {
  list: new Map(),
  emitQueue: new Map(),

  on: function (eventName, callback) {
    if (!this.list.has(eventName)) {
      this.list.set(eventName, []);
    }
    this.list.get(eventName).push(callback);

    return this
  },

  off: function (eventName, callback) {
    if (!this.list.has(eventName)) {
      return
    }
    const eventList = this.list.get(eventName);
    const index = eventList.indexOf(callback);
    if (index > -1) {
      eventList.splice(index, 1);
    }

    return this
  },

  cancelEmit(eventName) {
    const timers = this.emitQueue.get(eventName);
    if (timers) {
      timers.forEach(clearTimeout);
      this.emitQueue.delete(eventName);
    }

    return this
  },
  emit: function (eventName, ...args) {
    if (!this.list.has(eventName)) {
      return
    }
    const eventList = this.list.get(eventName);
    const timers = [];
    eventList.forEach((callback) => {
      timers.push(setTimeout(() => {
        callback(...args);
      }, 0));
    });
    this.emitQueue.set(eventName, []);
    this.emitQueue.set(eventName, timers);

    return this
  }
}

let containers = new Map();
let queue = [];

function onboard(content, options) {
  if (containers.size > 0) {
    eventManager.emit('onboard:show', content, options)
  } else {
    queue.push({ content, options })
  }

  return options.id
}

onboard.show = function (content, options) {
  if (containers.size > 0) {
    eventManager.emit('onboard:show', content, options)
  } else {
    queue.push({ content, options })
  }

  return options.id
}

onboard.hide = function (id) {
  eventManager.emit('onboard:hide', id)
}

onboard.getAll = function () {
  return containers
}

onboard.get = function (id) {
  return containers.get(id)
}

export { onboard }