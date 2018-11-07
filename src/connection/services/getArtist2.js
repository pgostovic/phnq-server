export default async ({ mbid, name }, { lastFMClient, spotifyClient }) =>
  lastFMClient.getArtistInfo2({ mbid, artist: name });
