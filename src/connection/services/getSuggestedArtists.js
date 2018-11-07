import { uniq, shuffle } from 'phnq-lib';
import Artist from '../../model/artist';
import Track from '../../model/track';
import { groupByTags } from '../util/cluster';
import Tag from '../../model/tag';
import { RequiresSpotifyConnection } from '../auth';

export const auth = RequiresSpotifyConnection;

export default async ({ limit = 20 }, { lastFMClient, spotifyClient }) => {
  const [topArtistsSpotify, topTracksSpotify] = await Promise.all([
    spotifyClient.getTopArtists(),
    spotifyClient.getTopTracks(),
  ]);

  const topArtists = topArtistsSpotify.map(Artist.spotify);
  const topTracks = topTracksSpotify.map(Track.spotify);

  const seedArtists = uniq([...topArtists, ...topTracks.map(track => track.artist)], a => a.id);
  const seedIds = new Set(seedArtists.map(seed => seed.id));
  const groups = (await groupByTags(seedArtists, lastFMClient)).filter(group => group.distinct);

  const artists = shuffle(
    uniq(
      (await Promise.all(
        groups.map(group =>
          spotifyClient.getRecommendations({
            artistIds: group.members.map(member => member.subject).map(artist => artist.id),
          })
        )
      ))
        .reduce((allTracks, tracks) => allTracks.concat(tracks), [])
        .map(track => Track.spotify(track))
        .map(track => track.artist),
      i => i.id
    ).filter(artist => !seedIds.has(artist.id))
  ).slice(0, limit - 1);

  const resps = await Promise.all([
    ...artists.map(artist => spotifyClient.getArtist(artist.id)),
    ...artists.map(artist => lastFMClient.getArtistTopTags(artist.name)),
  ]);

  const suggestedArtists = resps
    .slice(0, limit - 1)
    .map((artist, i) => new Artist({ ...Artist.spotify(artist), tags: resps[i + limit - 1].map(Tag.lastFM) }));

  return suggestedArtists;
};
