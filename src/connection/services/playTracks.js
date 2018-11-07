import { RequiresSpotifyConnection } from '../auth';

export const auth = RequiresSpotifyConnection;

export default async ({ trackIds }, { spotifyClient }) => {
  await spotifyClient.playTracks(trackIds);
  return true;
};
