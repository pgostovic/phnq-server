import WebSocket from 'isomorphic-ws';
import prettyHrtime from 'pretty-hrtime';
import { newLogger, hrtime } from 'phnq-lib';
import { toModel } from '../model';

const log = newLogger('phnq.api');

const serviceTypes = [
  'login',
  'logout',
  'authenticate',
  'createAccount',
  'setPassword',
  'getTopArtists',
  'getArtist',
  'getArtist2',
  'getSimilarArtists',
  'getArtistImages',
  'getArtistAlbums',
  'getAlbum',
  'getAlbumTags',
  'getAlbumDescription',
  'setSpotifyCode',
  'getSpotifyProfile',
  'connectSpotify',
  'getTag',
  'getRelatedTags',
  'getMixes',
  'getSuggestedArtists',
  'pausePlayer',
  'playTracks',
  'getPlayer',
  'subscribe',
  'unsubscribe',
  'searchArtists',
  'spotifyGet',
];

const onErrors = [];

export const onApiError = onError => {
  onErrors.push(onError);
};

let ons = [];

export const api = {
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
    const s = new WebSocket('ws://localhost:9090/api');

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
      const { id, type, data } = JSON.parse(event.data);
      const responseHandler = responseHandlers[id];
      if (responseHandler) {
        responseHandler(type, data, dataLen);
      } else {
        ons
          .filter(on => on.type === type)
          .forEach(on => {
            try {
              on.fn(toModel(data));
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
      // if client...
      const start = hrtime();
      const s = await getSocket();
      const id = messageId.next().value;
      const msg = { id, type, data };
      s.send(JSON.stringify(msg));
      const resp = await getResponse(id);

      log('%s %o -> %d bytes %o', prettyHrtime(hrtime(start)), msg, resp.dataLen, resp.data);

      resp.data = toModel(resp.data);

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
