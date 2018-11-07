import Tag from '../../model/tag';
import Artist from '../../model/artist';
import Track from '../../model/track';

export default async ({ name }, { lastFMClient, spotifyClient }) => {
  const [tagInfo, topArtistsLastFm, topTracksLastFm] = await Promise.all([
    lastFMClient.getTagInfo(name),
    lastFMClient.getTagTopArtists(name),
    lastFMClient.getTagTopTracks(name),
  ]);

  const topTracks = (await Promise.all(
    topTracksLastFm.map(track => spotifyClient.searchTracks(track.name, track.artist.name))
  ))
    .filter(results => results.length > 0)
    .map(([t]) => Track.spotify(t));

  const topArtists = topArtistsLastFm.map(Artist.lastFM);

  return new Tag({ ...Tag.lastFM(tagInfo), topTracks, topArtists });
};
