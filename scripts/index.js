import dotenv from 'dotenv';
import { Pool } from 'pg';
import Cursor from 'pg-cursor';
import { newLogger } from 'phnq-lib';
import elasticsearch from 'elasticsearch';

dotenv.config();

const esClient = elasticsearch.Client({
  host: process.env.ES_HOST,
});

const log = newLogger('phnq-server.index');

const pool = new Pool();

const cursorRead = async (cursor, num) =>
  new Promise((resolve, reject) => {
    cursor.read(num, async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });

const doWhile = async (fn, test) => {
  await fn();

  if (test()) {
    await doWhile(fn, test);
  }
};

(async () => {
  const client = await pool.connect();

  await esClient.indices.delete({ index: 'artists' });

  await esClient.indices.create({
    index: 'artists',
    body: {
      mappings: {
        _doc: {
          properties: {
            suggest: {
              type: 'completion',
            },
          },
        },
      },
    },
  });

  const cursor = client.query(
    new Cursor(`
    SELECT
      a.gid AS mbid,
      a.name,
      a.comment,
      ARRAY(SELECT name from musicbrainz.artist_alias WHERE artist=a.id) as aliases,
      ARRAY (
        SELECT
          t.name
        FROM
          musicbrainz.tag t,
          musicbrainz.artist_tag atag,
          musicbrainz.artist a2
        WHERE
          a2.id = atag.artist
          AND atag.tag = t.id
          AND a2.id = a.id
        ORDER BY
          atag.count DESC
      ) as tags,
      ac.ref_count
    FROM
      musicbrainz.artist a,
      musicbrainz.artist_credit_name acn,
      musicbrainz.artist_credit ac
    WHERE
      a.id = acn.artist
      AND acn.artist_credit = ac.id
      AND ac.name = a.name
  `)
  );

  let numRows;
  let totalRows = 0;

  await doWhile(
    async () => {
      const body = [];
      const rows = await cursorRead(cursor, 10000);
      rows.forEach(({ mbid, name, comment, aliases, tags, ref_count: refCount }) => {
        const extraAlias = name.match(/^The\s/) ? name.replace(/^The\s/, '') : null;
        if (extraAlias && !aliases.includes(extraAlias)) {
          aliases.push(extraAlias);
        }
        body.push({ index: { _index: 'artists', _id: mbid, _type: '_doc' } });
        body.push({
          doc: {
            mbid,
            type: 'artist',
            name,
            comment,
            aliases,
            tags,
          },
          suggest: [
            { input: name, weight: refCount },
            ...aliases.map(alias => ({ input: alias, weight: Math.round(refCount / 2) })),
          ],
        });
      });

      numRows = rows.length;

      if (numRows > 0) {
        await esClient.bulk({ body });

        totalRows += numRows;
        log('Indexed %d', totalRows);
      }
    },
    () => numRows > 0
  );

  log('DONE');

  client.release();
  await pool.end();
})();
