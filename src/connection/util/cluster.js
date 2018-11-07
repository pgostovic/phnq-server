import { LastFMClient, uniq, isSubset, intersects } from 'phnq-lib';
import Tag, { Taggable } from '../../model/tag';
import { normalize } from './normalize';

let nextGroupIdx = 0;

const groupIdx = () => {
  nextGroupIdx += 1;
  return nextGroupIdx;
};

/**
 * Clusters taggables according to similarity of tags.
 */
export const clusterTaggables = taggables => {
  /**
   * Compare taggables with each other and determine similarity scores for
   * each comparison based on tags.
   */
  const compares = [];

  taggables.forEach((taggable1, i) => {
    taggables.slice(i + 1).forEach(taggable2 => {
      /**
       * Score as follows:
       * Add weights for intersecting tags.
       * Subtract weights for non-intersecting tags.
       */
      const tagNames1 = taggable1.tags.map(tag => tag.name);
      const tagNames2 = taggable2.tags.map(tag => tag.name);
      const allTagNames = new Set(tagNames1.concat(tagNames2));

      let score = 0;
      const tagScores = {};
      allTagNames.forEach(tagName => {
        if (tagNames1.includes(tagName) && tagNames2.includes(tagName)) {
          const tagScore =
            taggable1.tags.find(tag => tag.name === tagName).weight +
            taggable2.tags.find(tag => tag.name === tagName).weight;
          score += tagScore;
          tagScores[tagName] = tagScore;
        } else if (tagNames1.includes(tagName)) {
          score -= 2 * taggable1.tags.find(tag => tag.name === tagName).weight;
        } else if (tagNames2.includes(tagName)) {
          score -= 2 * taggable2.tags.find(tag => tag.name === tagName).weight;
        }
      });

      compares.push({ taggables: [taggable1, taggable2], score, tagScores });
    });
  });

  // Sort the comparisons by score
  compares.sort((c1, c2) => c2.score - c1.score);

  const groups = [];

  compares.filter(c => c.score > 0).forEach((c1, i) => {
    const compareGroup = [c1];
    compares
      .filter(c => c.score > 0)
      .slice(i + 1)
      .forEach(c2 => {
        if (c2.taggables.filter(a => c1.taggables.includes(a)).length > 0) {
          compareGroup.push(c2);
        }
      });

    const group = {
      score: 0,
      distinct: false,
      members: new Set(),
      tags: {},
      maxGroupSize: 3 + Math.round(2 * Math.random()),
    };

    compareGroup.forEach(c => {
      let added = false;
      c.taggables.forEach(taggable => {
        if (group.members.size < group.maxGroupSize && !group.members.has(taggable)) {
          group.members.add(taggable);
          group.score += c.score;
          added = true;
        }
      });

      if (added) {
        Object.keys(c.tagScores).forEach(tag => {
          group.tags[tag] = (group.tags[tag] || 0) + c.tagScores[tag];
        });
      }
    });

    if (groups.filter(g => isSubset(g.members, group.members)).length === 0) {
      group.distinct = groups.reduce(
        (distinct, g) => distinct && (!g.distinct || !intersects(g.members, group.members)),
        true
      );

      const tags = [];
      Object.keys(group.tags).forEach(name => {
        const all = [...group.members].filter(m => m.tags.find(tag => tag.name === name)).length === group.members.size;
        if (all) {
          tags.push({ name, score: group.tags[name] });
        }
      });
      tags.sort((t1, t2) => t2.score - t1.score);
      group.tags = normalize(tags, 'score').map(tag => new Tag({ name: tag.name, weight: tag.score }));

      group.id = String(groupIdx());

      groups.push(group);
    }
  });

  return normalize(groups.map(group => ({ ...group, members: [...group.members] })), 'score');
};

export const groupByTags = async (artists, lastFMClient = new LastFMClient()) => {
  const artistsUniq = uniq(artists, artist => artist.id);
  const tagResps = (await Promise.all(artistsUniq.map(artist => lastFMClient.getArtistTopTags(artist.name)))).map(
    tags => tags.map(Tag.lastFM)
  );
  const taggables = artistsUniq.map((artist, i) => new Taggable({ subject: artist, tags: tagResps[i] }));

  return clusterTaggables(taggables);
};
