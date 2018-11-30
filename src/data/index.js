import { Mongo, newLogger } from 'phnq-lib';
import Account from '../model/account';
import Session from '../model/session';
import CacheEntry from '../model/cacheEntry';
import Artist from '../model/artist';
import MBRelease from '../model/mb/mbRelease';

const log = newLogger('phnq.data');

// docker run --name pg-mongo -d -p 27017:27017 mongo:4
// docker start pg-mongo
// docker stop pg-mongo

// brew services restart postgresql

export const init = async () => {
  log('Creating mongo client: %s', process.env.MONGODB_URI);
  const client = new Mongo(process.env.MONGODB_URI);
  try {
    log('Connecting...');
    await client.connect();

    log('Adding models...');
    await client.addModel(Account);
    await client.addModel(Session);
    await client.addModel(CacheEntry);
    await client.addModel(Artist);
    await client.addModel(MBRelease);

    log('Initialized.');
  } catch (err) {
    log('ERROR initializing data', err);
  }
  return client;
};

export const reset = async () => {
  const client = await init();

  await Account.reset();
  await Account.createIndex({ email: 1 }, { unique: true });

  await Session.reset();

  await CacheEntry.reset();
  await CacheEntry.createIndex({ key: 1 }, { unique: true });

  // Default accounts
  ['pg+user_1@phranq.com', 'pg+user_2@phranq.com', 'pg+user_3@phranq.com'].forEach(email => {
    new Account({ email, password: 'password' }).save();
  });

  client.close();
};
