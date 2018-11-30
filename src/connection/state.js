import md5 from 'md5';
import elasticsearch from 'elasticsearch';
import { SpotifyClient, LastFMClient, wikipedia, bandsintown, songkick } from 'phnq-lib';
import PersistentCache from '../data/persistentCache';

const { setCache: setWikiClientCache } = wikipedia;
const { setCache: setBandsintownCache, setAppId: setBandsintownAppId } = bandsintown;
const { setCache: setSongkickCache, setApiKey: setSongkickApiKey } = songkick;

const cache = new PersistentCache();

setWikiClientCache(cache);
setBandsintownCache(cache);
setSongkickCache(cache);

setTimeout(() => {
  setBandsintownAppId(process.env.BANDSINTOWN_APP_ID);
  setSongkickApiKey(process.env.SONGKICK_API_KEY);
}, 1);

export class State {
  constructor(conn) {
    this.conn = conn;
    this.state = {};
    this.subscriptions = [];
  }

  cleanUp() {
    this.state = {};
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
  }

  remove(key) {
    delete this.state[key];
  }

  get session() {
    return this.get('session');
  }

  set session(session) {
    this.set('session', session);
    this.updateSubscriptions();
  }

  updateSubscriptions() {
    this.subscriptions.forEach(sub => {
      sub.stop();
    });

    this.subscriptions.length = 0;

    this.session.subscriptions.forEach(({ type, data }) => {
      const Subscription = require(`./subscriptions/${type}`).default; // eslint-disable-line
      if (Subscription) {
        const sub = new Subscription(this);
        this.subscriptions.push(sub);
        sub.start(data);
      }
    });
  }

  get elasticsearchClient() {
    let client = this.get('elasticsearchClient');
    if (!client) {
      client = elasticsearch.Client({
        host: process.env.ES_HOST,
      });
      this.set('elasticsearchClient', client);
    }
    return client;
  }

  get lastFMClient() {
    let client = this.get('lastFMClient');
    if (!client) {
      client = new LastFMClient(process.env.LAST_FM_API_KEY, cache);
      this.set('lastFMClient', client);
    }
    return client;
  }

  get spotifyClient() {
    let client = this.get('spotifyUserClient');
    if (!client) {
      client = new SpotifyClient(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
        process.env.SPOTIFY_CLIENT_REDIRECT_URI,
        cache
      );
      const account = this.get('account');
      if (account) {
        client.userSalt = md5(account.id);
        client.accessToken = account.spotify.accessToken;
        client.refreshToken = account.spotify.refreshToken;
        client.expiry = account.spotify.expiry;

        client.onTokenRefreshed(async () => {
          const { accessToken, refreshToken, expiry } = client;
          account.spotify = { ...account.spotify, accessToken, refreshToken, expiry };
          await account.save();
        });
      }
      this.set('spotifyUserClient', client);
    }
    return client;
  }
}
