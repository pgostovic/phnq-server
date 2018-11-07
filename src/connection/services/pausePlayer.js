import { RequiresSpotifyConnection } from '../auth';

export const auth = RequiresSpotifyConnection;

export default async (state, { spotifyClient }) => {
  await spotifyClient.pause();
  return true;
};
