import { MongoModel, string, bool, instanceOf, number, arrayOf } from 'phnq-lib';

class MBArtist extends MongoModel {
  static schema = {
    mbid: string.isRequired,
    name: string.isRequired,
    aliases: arrayOf(string),
    ended: bool.isRequired,
    type: string,
    beginDate: instanceOf(Date),
    beginArea: string,
    endDate: instanceOf(Date),
    endrea: string,
    refCount: number.isRequired,
  };

  constructor(data) {
    const props = { ...data };
    props.refCount = data.ref_count;
    if (data.begin_date_year) {
      props.beginDate = new Date(Date.UTC(data.begin_date_year, data.begin_date_month, data.begin_date_day));
    }
    if (data.end_date_year) {
      props.endDate = new Date(Date.UTC(data.end_date_year, data.end_date_month, data.end_date_day));
    }

    super(props);
  }
}

export default MBArtist;
