import { ConnectionLoggedOutError } from '../errors';

export default async (data, state, send) => {
  const { session } = state;
  if (session) {
    session.active = false;
    state.remove('session');
    state.remove('account');
    await session.save();
    send('response', 'connection closed');
    throw new ConnectionLoggedOutError();
  }
  throw new Error('Not logged in');
};
