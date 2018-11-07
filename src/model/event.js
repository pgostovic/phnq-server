import { Model, string, number, instanceOf, shape, arrayOf } from 'phnq-lib';

class Event extends Model {
  static schema = {
    id: string.isRequired,
    datetime: instanceOf(Date),
    description: string,
    url: string.isRequired,
    distance: number,
    venue: shape({
      name: string,
      city: string,
      region: string,
      country: string,
      latitude: number,
      longitude: number,
    }).isRequired,
    lineup: arrayOf(string).isRequired,
  };

  constructor(props) {
    const p = props;

    if (p.datetime && typeof p.datetime === 'string') {
      p.datetime = new Date(p.datetime);
    }

    if (p.venue && typeof p.venue.latitude === 'string') {
      p.venue.latitude = parseFloat(p.venue.latitude);
    }

    if (p.venue && typeof p.venue.longitude === 'string') {
      p.venue.longitude = parseFloat(p.venue.longitude);
    }

    super(p);
  }
}

export default Event;
