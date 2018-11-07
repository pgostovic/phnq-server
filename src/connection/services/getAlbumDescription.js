import striptags from 'striptags';
import { wikipedia } from 'phnq-lib';

const { search, getPageIntro } = wikipedia;

export default async ({ artistName, albumName, type = 'album' }) => {
  const pageId = (await search(`${artistName} ${albumName} ${type}`))
    .filter(({ title, snippet }) => {
      const strippedSnippet = striptags(snippet);

      // album name must be in the page title
      if (!title.match(new RegExp(albumName, 'i'))) {
        return false;
      }

      // artist name must be in the page title or snippet
      if (!`${title} ${strippedSnippet}`.match(new RegExp(artistName, 'i'))) {
        return false;
      }

      // type (i.e. album/ep) must be in the page title or snippet
      if (!`${title} ${strippedSnippet}`.match(new RegExp(type, 'i'))) {
        return false;
      }

      return true;
    })
    .map(result => result.pageid)[0];

  if (pageId) {
    return getPageIntro(pageId);
  }
  return null;
};
