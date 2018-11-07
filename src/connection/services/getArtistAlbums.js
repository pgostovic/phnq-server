import stringSim from 'string-similarity';
import { wikipedia } from 'phnq-lib';

const { search } = wikipedia;

export default async ({ id, name }, { spotifyClient, lastFMClient }) => {
  const [{ pageid }] = await search(`${name} discography`);
  return pageid;
};
// const topLastFMAlbums = await lastFMClient.getArtistTopAlbums(name || (await spotifyClient.getArtist(id).name));
// const spotifyAlbums = await spotifyClient.getArtistAlbums(id || (await spotifyClient.searchArtists(name))[0].id);

// const topLastFMAlbumsNames = topLastFMAlbums.map(a => a.name);
// const spotifyAlbumsNames = spotifyAlbums.map(a => a.name);

// spotifyAlbumsNames.forEach(n => {
//   const { bestMatch } = stringSim.findBestMatch(n, topLastFMAlbumsNames);
//   console.log('MATCH', n, bestMatch.target, bestMatch.rating);
// });

// return {
//   sims: spotifyAlbumsNames.map(n => [n, stringSim.findBestMatch(n, topLastFMAlbumsNames).bestMatch.target]),
//   spotifyAlbumsNames,
//   topLastFMAlbumsNames,
// };

// return search(`${name} discography`);
