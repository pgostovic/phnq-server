import { MongoModel, any, number, string } from 'phnq-lib';

class CacheEntry extends MongoModel {
  static schema = {
    key: string.isRequired,
    value: any.isRequired,
    expiry: number.isRequired,
  };
}

export default CacheEntry;
