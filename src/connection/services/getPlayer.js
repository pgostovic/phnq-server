import PlayerState from '../../model/playerState';
import { RequiresSpotifyConnection } from '../auth';

export const auth = RequiresSpotifyConnection;

export default async ({ type = 'spotify' }, { spotifyClient }) =>
  type === 'spotify' ? PlayerState.spotify(await spotifyClient.getPlayer()) : null;
