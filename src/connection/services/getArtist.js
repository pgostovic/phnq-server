import Artist from '../../model/artist';

console.log('Artist hash server', Object.keys(Artist.schema).sort());

export default async ({ mbid }, { lastFMClient }) => {
  const [dbArtist, lfmArtist] = await Promise.all([Artist.one({ mbid }), lastFMClient.getArtistInfo({ mbid })]);
  // console.log('lfmArtist', lfmArtist.bio.content);
  return new Artist({ ...dbArtist, bio: lfmArtist.bio.content });
};
