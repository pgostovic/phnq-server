import { uniq } from 'phnq-lib';
import Artist from '../../model/artist';
import Track from '../../model/track';
import { groupByTags } from '../util/cluster';
import { RequiresSpotifyConnection } from '../auth';

export const auth = RequiresSpotifyConnection;

export default async (data, { spotifyClient, lastFMClient }) => {
  const [topArtistsSpotify, topTracksSpotify] = await Promise.all([
    spotifyClient.getTopArtists(),
    spotifyClient.getTopTracks(),
  ]);

  const topArtists = topArtistsSpotify.map(Artist.spotify);
  const topTracks = topTracksSpotify.map(Track.spotify);

  const seedArtists = uniq([...topArtists, ...topTracks.map(track => track.artist)], a => a.id);

  const groups = (await groupByTags(seedArtists, lastFMClient)).filter(group => group.distinct);

  const groupedRecos = await Promise.all(
    groups.map(group =>
      spotifyClient.getRecommendations({
        artistIds: group.members.map(member => member.subject).map(artist => artist.id),
      })
    )
  );

  return groups.map((group, i) => ({ ...group, tracks: groupedRecos[i].map(t => Track.spotify(t)) }));
};
