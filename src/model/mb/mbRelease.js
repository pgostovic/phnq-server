import { MongoModel, string, instanceOf, arrayOf } from 'phnq-lib';

class MBRelease extends MongoModel {
  static schema = {
    mbid: string.isRequired,
    artistMbid: string.isRequired,
    name: string.isRequired,
    type: string.isRequired,
    subType: arrayOf(string).isRequired,
    releaseDate: instanceOf(Date),
  };

  constructor(props) {
    console.log('RELEASE', props);
    //   const { mbid, artistMbid, name, type, secondary_type: subType, date: releaseDate } = props;
    //   super({ mbid, artistMbid, name, type, subType, releaseDate });
    super(props);
  }
}

export default MBRelease;
