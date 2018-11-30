import WebSocket from 'isomorphic-ws';
import prettyHrtime from 'pretty-hrtime';
import { newLogger, hrtime, deserialize } from 'phnq-lib';
import models from '../model';

const log = newLogger('phnq.api');

const serviceTypes = __SERVICE_TYPES__;

const apiScriptUrl = [...window.document.scripts].map(({ src }) => src).find(src => src.match(/\/phnqapi\.js$/));
const apiWSUrl = apiScriptUrl.replace(/^http/, 'ws').replace(/\.js$/, '');

const onErrors = [];

const onApiError = onError => {
  onErrors.push(onError);
};

let ons = [];

const api = {
  on(type, fn) {
    ons.push({ type, fn });
  },

  off(type, fn) {
    ons = ons.filter(on => on.type !== type || on.fn !== fn);
  },
};

const messageId = (function* messageIdGen() {
  let i = 0;
  while (true) {
    i += 1;
    yield i;
  }
})();

const responseHandlers = {};

const getResponse = async id =>
  new Promise((resolve, reject) => {
    const respPid = setTimeout(() => {
      delete responseHandlers[id];
      reject(new Error(`Response timed out: ${id}`));
    }, 10000);

    responseHandlers[id] = (type, data, dataLen) => {
      delete responseHandlers[id];
      clearTimeout(respPid);
      resolve({ type, data, dataLen });
    };
  });

let socket;

const getSocket = async () => {
  if (socket) {
    return Promise.resolve(socket);
  }

  return new Promise((resolve, reject) => {
    const s = new WebSocket(apiWSUrl);

    s.addEventListener('open', () => {
      socket = s;
      resolve(socket);
    });

    s.addEventListener('close', () => {
      log('Socket was closed');
      socket = null;
    });

    s.addEventListener('error', event => {
      log('Socket error: %s', event.message);
      reject(new Error(event.message));
    });

    s.addEventListener('message', event => {
      const dataLen = event.data.length;
      console.log('DATA', JSON.parse(event.data));
      const { id, type, data } = deserialize(event.data);
      const responseHandler = responseHandlers[id];
      if (responseHandler) {
        responseHandler(type, data, dataLen);
      } else {
        ons
          .filter(on => on.type === type)
          .forEach(on => {
            try {
              on.fn(data);
            } catch (err) {
              log('Error handling notification: %O', err);
            }
          });
      }
    });
  });
};

serviceTypes.forEach(type => {
  Object.defineProperty(api, type, {
    value: async data => {
      const start = hrtime();
      const s = await getSocket();
      const id = messageId.next().value;
      const msg = { id, type, data };
      s.send(JSON.stringify(msg));
      const resp = await getResponse(id);

      log('%s %o -> %d bytes %o', prettyHrtime(hrtime(start)), msg, resp.dataLen, resp.data);

      // resp.data = toModel(resp.data);

      if (resp.type === 'response') {
        return resp.data;
      }

      if (resp.type === 'error') {
        onErrors.forEach(onError => {
          onError(resp.data);
        });
        throw new ApiError(type, resp.data.message);
      } else {
        log('OTHER %s %o', resp.type, resp.data);
      }
      return resp;
    },
    writable: false,
    enumerable: true,
  });
});

class ApiError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

if (window.apiLoaded) {
  window.apiLoaded(api, onApiError, models);
}
