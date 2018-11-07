export const normalize = (tags, field) => {
  const fieldMax = tags.reduce((max, tag) => Math.max(max, tag[field]), 0);
  return tags.map(tag => ({ ...tag, [field]: Math.round(100 * (tag[field] / fieldMax)) }));
};
