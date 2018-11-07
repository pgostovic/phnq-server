import { RequiresActiveSession } from '../auth';

export const auth = RequiresActiveSession;

export default async ({ type }, state) => {
  const { session } = state;
  session.removeSubscription(type);
  await session.save();
  state.updateSubscriptions();
  return true;
};
