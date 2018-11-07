/* eslint class-methods-use-this: 0 */
import { Cache } from 'phnq-lib';
import CacheEntry from '../model/cacheEntry';

export default class PersistentCache extends Cache {
  async get(key) {
    let val = super.get(key);
    if (!val) {
      const entry = await CacheEntry.one({ key });
      if (entry) {
        val = entry.value;
        this.put(key, val, { postPut: false });
      }
    }
    return val;
  }

  postPut(key, value) {
    new CacheEntry({ key, value, expiry: 0 }).save();
  }
}
