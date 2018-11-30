import Artist from '../../model/artist';

export default async ({ text, id }, { spotifyClient }) => ({
  id,
  results: (await spotifyClient.searchArtists(`${text}*`)).map(Artist.spotify),
});
