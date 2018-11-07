import Album from '../../model/album';

export default async ({ id }, { spotifyClient }) => Album.spotify(await spotifyClient.getAlbum(id));
