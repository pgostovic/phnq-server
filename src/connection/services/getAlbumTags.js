import Tag from '../../model/tag';

export default async ({ artistName, albumName }, { lastFMClient }) =>
  (await lastFMClient.getAlbumTopTags(artistName, albumName)).map(Tag.lastFM);
