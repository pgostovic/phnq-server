/**
 * A Connection is a transport agnostic API for accessing
 * all of the business logic.
 */
import prettyHrtime from 'pretty-hrtime';
import uuid from 'uuid/v4';
import { newLogger } from 'phnq-lib';
import { State } from './state';
import { checkAuth } from './auth';
import { ConnectionLoggedOutError, UnkownMessageTypeError } from './errors';

const log = newLogger('phnq.connection');

export default class Connection {
  constructor() {
    Object.defineProperty(this, 'id', { value: uuid(), writable: false, enumerable: true });
    Object.defineProperty(this, 'createTime', { value: Date.now(), writable: false, enumerable: true });
    Object.defineProperty(this, 'onMessages', { value: [], writable: false, enumerable: false });
    Object.defineProperty(this, 'onCloses', { value: [], writable: false, enumerable: false });
    Object.defineProperty(this, 'state', { value: new State(this), writable: false, enumerable: false });
  }

  destroy() {
    this.state.cleanUp();
    this.onMessages.length = 0;
    this.onCloses.length = 0;
  }

  async handle(message) {
    const { id, type, data = {} } = message;

    log('>>> [%s] %s %o', id, type, data);

    const start = process.hrtime();

    try {
      let service;
      try {
        service = require(`./services/${type}`); // eslint-disable-line
      } catch (err) {
        throw new UnkownMessageTypeError(type);
      }

      const serviceFn = service.default;

      checkAuth(service.auth, this.state);

      const p = serviceFn(data, this.state, (sendType, sendData) => {
        log('<<< [%s] %s %s', id, prettyHrtime(process.hrtime(start)), sendType);
        this.onMessages.forEach(onMessage => onMessage({ id, type: sendType, data: sendData }));
      });

      if (p instanceof Promise) {
        const pData = await p;
        log('<<< [%s] %s response', id, prettyHrtime(process.hrtime(start)));
        this.onMessages.forEach(onMessage => onMessage({ id, type: 'response', data: pData }));
      }
    } catch (err) {
      if (err instanceof ConnectionLoggedOutError) {
        this.onCloses.forEach(onClose => onClose());
      } else {
        log(
          '<<< [%s] %s -> error: %s - %s :: %O',
          id,
          prettyHrtime(process.hrtime(start)),
          err.constructor.name,
          err.message,
          err
        );
        this.onMessages.forEach(onMessage =>
          onMessage({ id, type: 'error', data: { ...err, error: err.constructor.name, message: err.message } })
        );
      }
    }
  }

  onMessage(onMessage) {
    this.onMessages.push(onMessage);
  }

  onClose(onClose) {
    this.onCloses.push(onClose);
  }
}
