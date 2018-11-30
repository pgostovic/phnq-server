import { Model, string, arrayOf, instanceOf, shape, number } from 'phnq-lib';
import Tag from './tag';
import Track from './track';
import Album from './album';
import Event from './event';

const lastFMImgUrlRe = /\/i\/u\/([\dxs]*)\/[\d[a-f]*\.png$/;
const lastFMImgDimRe = /(\d*)[sx](\d*)/;

class ArtistX extends Model {
  static schema = {
    id: string,
    mbid: string,
    name: string.isRequired,
    images: arrayOf(shape({ url: string, width: number, height: number })),
    bio: string,
    tags: arrayOf(instanceOf(Tag)),
    topTracks: arrayOf(instanceOf(Track)),
    albums: arrayOf(instanceOf(Album)),
    events: arrayOf(instanceOf(Event)),
  };

  static spotify({ id, name, images = [] }) {
    return new ArtistX({
      name,
      id,
      images,
    });
  }

  static lastFM({ mbid, name, bio = {}, image = [], match }) {
    const images = image
      .map(imgObj => {
        const url = imgObj['#text'];
        if (url) {
          const [, dim] = url.match(lastFMImgUrlRe);
          const [, w, h] = dim.match(lastFMImgDimRe);
          return { url, width: w, height: h || w };
        }
        return null;
      })
      .filter(i => i !== null);

    return new ArtistX({
      mbid,
      name,
      bio: bio.content,
      images,
      match,
    });
  }

  constructor(props) {
    const p = props;

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

export default ArtistX;
