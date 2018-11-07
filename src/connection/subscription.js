export class Subscription {
  constructor(state, data) {
    this.state = state;
    this.data = data;
    this.stopped = false;
  }

  send(type, data) {
    this.state.conn.onMessages.forEach(onMessage => {
      onMessage({ type, data });
    });
  }

  isAlive() {
    return !this.stopped && this.state.conn.onMessages.length > 0;
  }

  stop() {
    this.stopped = true;
  }

  start() { } // eslint-disable-line
}
