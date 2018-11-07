import Account from '../../model/account';
import Session from '../../model/session';
import { InvalidCredentialsError } from '../errors';

export default async ({ email, password, code }, s) => {
  const state = s;

  if (state.session) {
    throw new Error('Already logged in.');
  }

  const account = await getAccount({ email, password, code });

  const session = new Session({ accountId: account.id, active: true });
  await session.save();
  state.set('account', account);
  state.session = session;
  return { sessionId: session.id };
};

const getAccount = async ({ email, password, code }) => {
  if (code) {
    const account = await Account.one({ code });
    if (!account) {
      throw new InvalidCredentialsError('The code you entered is incorrect.');
    }

    account.code = null;
    await account.save();

    return account;
  }

  const account = await Account.one({ email });
  if (account && account.password === password) {
    return account;
  }
  throw new InvalidCredentialsError('The email or password you entered is incorrect.');
};
