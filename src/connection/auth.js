import { AuthError } from './errors';

export const RequiresActiveSession = 1 << 0;
export const RequiresSpotifyConnection = 1 << 1;

export const checkAuth = (authMask, state) => {
  if (authMask & RequiresActiveSession) {
    if (!(state.session || {}).active) {
      throw new AuthError('Permission Denied: no active session');
    }
  }

  if (authMask & RequiresSpotifyConnection) {
    if (!state.spotifyClient.isConnected()) {
      throw new AuthError('Permission Denied: requires spotify connection');
    }
  }
};
