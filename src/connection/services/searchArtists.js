import Artist from '../../model/artist';

export default async ({ text }, { spotifyClient }) =>
  (await spotifyClient.searchArtists(`${text}*`)).map(Artist.spotify);
