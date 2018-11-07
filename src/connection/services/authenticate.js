import { newLogger } from 'phnq-lib';
import Session from '../../model/session';
import Account from '../../model/account';

const log = newLogger('phnq.services.authenticate');

export default async ({ sessionId }, s) => {
  const state = s;
  if (state.session) {
    if (state.session.id === sessionId) {
      const account = state.get('account');
      return {
        authenticated: true,
        spotifyConnected: state.spotifyClient.isConnected(),
        needsPassword: !account.password,
      };
    }
    throw new Error('Incorrect sessionId');
  }

  const session = await Session.one({ id: sessionId });
  if (session && session.active) {
    const account = await Account.one({ id: session.accountId });
    state.set('account', account);
    state.session = session;
    log('authenticated %s', account.email);
    return {
      authenticated: true,
      spotifyConnected: state.spotifyClient.isConnected(),
      needsPassword: !account.password,
    };
  }
  return { authenticated: false, spotifyConnected: false };
};
