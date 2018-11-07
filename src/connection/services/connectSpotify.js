import { SpotifyError } from 'phnq-lib';

export default async () => {
  throw new SpotifyError(401, 'Connect Spotify');
};
