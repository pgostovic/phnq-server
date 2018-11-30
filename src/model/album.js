import { Model, string, instanceOf, arrayOf, shape, number } from 'phnq-lib';
import Artist from './artist';
import Track from './track';

console.log('TRACK', Track);
console.log('Artist', Artist);

class Album extends Model {
  static schema = {
    id: string,
    name: string.isRequired,
    artist: instanceOf(Artist).isRequired,
    images: arrayOf(shape({ url: string, width: number, height: number })),
    releaseDate: instanceOf(Date),
    tracks: instanceOf(Track).isRequired,
  };

  static spotify(props) {
    const {
      id,
      name,
      artists: [artist],
      images = [],
      release_date: releaseDate,
      tracks = { items: [] },
    } = props;

    return new Album({
      id,
      name,
      artist: Artist.spotify(artist),
      images,
      tracks: tracks.items.map(Track.spotify),
      releaseDate,
    });
  }

  constructor(props) {
    const p = props;

    if (p.releaseDate && typeof p.releaseDate === 'string') {
      p.releaseDate = new Date(p.releaseDate);
    }

    p.images = p.images || [];
    p.images.sort((i1, i2) => i1.width - i2.width);

    super(p);
  }

  image(minWidth = 0, minHeight = 0) {
    const image =
      this.images.find(img => img.width >= minWidth && img.height >= minHeight) || this.images[this.images.length - 1];

    return (image || {}).url;
  }
}

export default Album;
