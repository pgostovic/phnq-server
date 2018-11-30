import { Model, string, number, arrayOf, instanceOf, any } from 'phnq-lib';

export const excludedTags = ['seen live', 'under 2000 listeners'];

export const filterTags = tag => !excludedTags.includes(tag.name.toLowerCase());

class Tag extends Model {
  static schema = {
    name: string.isRequired,
    weight: number,
    description: string,
  };
}

export default Tag;

export class Taggable extends Model {
  static schema = {
    subject: any.isRequired, // eslint-disable-line
    tags: arrayOf(instanceOf(Tag)).isRequired,
  };

  constructor({ subject, tags }) {
    super({ subject, tags: tags.filter(tag => !excludedTags.includes(tag.name)) });
  }
}
