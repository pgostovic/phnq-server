import { RequiresSpotifyConnection } from '../auth';

export const auth = RequiresSpotifyConnection;

export default async (data, { spotifyClient }) => spotifyClient.getTopArtists();
