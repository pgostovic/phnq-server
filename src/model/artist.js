import { MongoModel, string, bool, instanceOf, arrayOf } from 'phnq-lib';
import Tag from './tag';

console.log('TAG', Tag);

class Artist extends MongoModel {
  static schema = {
    mbid: string.isRequired,
    sid: string,
    name: string.isRequired,
    aliases: arrayOf(string),
    ended: bool.isRequired,
    type: string,
    tags: arrayOf(instanceOf(Tag)),
    beginDate: instanceOf(Date),
    beginArea: string,
    endDate: instanceOf(Date),
    endArea: string,
    bio: string,
  };

  constructor(data) {
    const props = { ...data };
    if (data.beginDateYear) {
      props.beginDate = new Date(Date.UTC(data.beginDateYear, data.beginDateMonth, data.beginDateDay));
    }
    if (data.endDateYear) {
      props.endDate = new Date(Date.UTC(data.endDateYear, data.endDateMonth, data.endDateDay));
    }

    super(props);
  }
}

export default Artist;
