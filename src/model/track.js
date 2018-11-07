import { Model, string, number, instanceOf } from 'phnq-lib';
import Artist from './artist';
import Album from './album';

class Track extends Model {
  static schema = {
    id: string.isRequired,
    name: string.isRequired,
    artist: instanceOf(Artist),
    album: instanceOf(Album),
    previewUrl: string,
    durationMillis: number,
  };

  static spotify({ name, id, preview_url: previewUrl, album, artists: [artist], duration_ms: durationMillis }) {
    return new Track({
      id,
      name,
      artist: Artist.spotify(artist),
      album: album ? Album.spotify(album) : undefined,
      previewUrl,
      durationMillis,
    });
  }
}

export default Track;
