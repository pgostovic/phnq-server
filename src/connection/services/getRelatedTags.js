import Tag, { excludedTags } from '../../model/tag';
import { normalize } from '../util/normalize';

export default async ({ name }, { lastFMClient }) => {
  const topArtistsLastFm = await lastFMClient.getTagTopArtists(name, 20);
  const topTagResps = await Promise.all(topArtistsLastFm.map(a => lastFMClient.getArtistTopTags(a.name)));

  const exTags = new Set([...excludedTags, name]);
  const tagsByName = {};

  topTagResps.forEach(topTags => {
    topTags.forEach(t => {
      if (!exTags.has(t.name)) {
        if (tagsByName[t.name]) {
          tagsByName[t.name].count += t.count;
        } else {
          tagsByName[t.name] = { name: t.name, count: t.count };
        }
      }
    });
  });

  return normalize(
    Object.values(tagsByName)
      .sort((t1, t2) => t2.count - t1.count)
      .slice(0, 20),
    'count'
  ).map(Tag.lastFM);
};
