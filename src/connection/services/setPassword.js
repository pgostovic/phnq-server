import { RequiresActiveSession } from '../auth';

export const auth = RequiresActiveSession;

export default async ({ password }, state) => {
  const account = state.get('account');
  account.password = password;
  await account.save();
  return true;
};
