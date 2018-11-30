export default async ({ text, id }, { elasticsearchClient }) => ({
  id,
  results: (await elasticsearchClient.search({
    index: 'artists',
    body: {
      suggest: {
        nameSuggest: {
          prefix: text,
          completion: {
            field: 'suggest',
            size: 10,
          },
        },
      },
    },
  })).suggest.nameSuggest[0].options.map(option => ({ match: option.text, source: option._source.doc })),
});

const log = o => {
  console.log('LOG: ', JSON.stringify(o, 0, 2));
  return o;
};
