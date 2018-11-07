import { RequiresActiveSession } from '../auth';

export const auth = RequiresActiveSession;

export default async ({ type, data }, state) => {
  const { session } = state;
  session.addSubscription(type, data);
  await session.save();
  state.updateSubscriptions();
  return true;
};
