import dotenv from 'dotenv';
import { Pool } from 'pg';
import Cursor from 'pg-cursor';
import { newLogger, saveMany } from 'phnq-lib';
import { init as initMongo } from '../src/data';
import Artist from '../src/model/artist';
import Tag from '../src/model/tag';

dotenv.config();

const log = newLogger('phnq-server.import');

const SPOTIFY_ARTIST_URL_RE = /https:\/\/open\.spotify\.com\/artist\/(.+)/;

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
  const mongo = await initMongo();
  const client = await pool.connect();

  await Artist.reset();
  await Artist.createIndex({ mbid: 1 });
  await Artist.createIndex({ name: 1 });

  const cursor = client.query(
    new Cursor(`
    SELECT
      a.gid AS mbid,
      ARRAY(select u.url
        from
	        musicbrainz.l_artist_url au,
	        musicbrainz.url u
        WHERE
	        au.entity0 = a.id
        	and au.entity1 = u.id
      ) as urls,
      a.name,
      ARRAY(SELECT name from musicbrainz.artist_alias WHERE artist=a.id) as aliases,
      a.ended,
      (SELECT name FROM musicbrainz.artist_type WHERE id = a.type) AS TYPE,
      a.begin_date_year,
      a.begin_date_month,
      a.begin_date_day,
      (SELECT name FROM musicbrainz.area WHERE id = a.begin_area) AS begin_area,
      a.end_date_year,
      a.end_date_month,
      a.end_date_day,
      (SELECT name FROM musicbrainz.area WHERE id = a.end_area) AS end_area,
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
      ARRAY (
        SELECT
          atag.count
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
      ) as tag_counts,
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
      const rows = await cursorRead(cursor, 10000);
      const artists = [];
      rows.forEach(
        ({
          mbid,
          urls,
          name,
          aliases,
          ended,
          type,
          tags,
          tag_counts: tagCounts,
          begin_date_year: beginDateYear,
          begin_date_month: beginDateMonth,
          begin_date_day: beginDateDay,
          end_date_year: endDateYear,
          end_date_month: endDateMonth,
          end_date_day: endDateDay,
        }) => {
          const sid = urls.reduce((spId, url) => spId || (SPOTIFY_ARTIST_URL_RE.exec(url) || [])[1], null);
          artists.push(
            new Artist({
              mbid,
              sid,
              name,
              aliases,
              ended,
              type,
              tags: tags.map((tagName, i) => new Tag({ name: tagName, weight: tagCounts[i] })),
              beginDateYear,
              beginDateMonth: (beginDateMonth || 0) - 1,
              beginDateDay,
              endDateYear,
              endDateMonth: (endDateMonth || 0) - 1,
              endDateDay,
            })
          );
        }
      );

      numRows = rows.length;

      if (numRows > 0) {
        saveMany(artists);

        totalRows += numRows;
        log('Imported %d', totalRows);
      }
    },
    () => numRows > 0
  );

  log('DONE');

  client.release();
  await pool.end();
  mongo.close();
})();
