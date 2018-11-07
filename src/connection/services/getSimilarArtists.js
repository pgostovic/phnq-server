import { uniq } from 'phnq-lib';
import Artist from '../../model/artist';

export default async ({ name, limit = 10 }, { lastFMClient, spotifyClient }) => {
  const similarArtists = (await Promise.all(
    (await lastFMClient.getSimilarArtists(name, limit)).map(artist => spotifyClient.searchArtists(artist.name))
  ))
    .filter(a => a.length > 0)
    .map(([{ id, name: artistName, images }]) => Artist.spotify({ id, name: artistName, images }));

  return uniq(similarArtists, a => a.id).filter(a => a.name !== name);
};
