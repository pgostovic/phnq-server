import { uniq, bandsintown, songkick } from 'phnq-lib';
import Artist from '../../model/artist';
import Tag from '../../model/tag';
import Track from '../../model/track';
import Album from '../../model/album';
import Event from '../../model/event';
import MBRelease from '../../model/mb/mbRelease';

const { getArtistEvents } = bandsintown;
const { getArtistCalendar } = songkick;

export default async ({ id, name }, { lastFMClient, spotifyClient }) => {
  let lastFmArtist;
  let spotifyArtist;
  let topTags;
  let topTracks;
  let spotifyAlbums;
  let artistEvents;

  if (id && name) {
    [lastFmArtist, spotifyArtist, topTags, topTracks, spotifyAlbums, artistEvents] = await Promise.all([
      lastFMClient.getArtistInfo({ artist: name }),
      spotifyClient.getArtist(id),
      lastFMClient.getArtistTopTags(name),
      spotifyClient.getArtistTopTracks(id),
      spotifyClient.getArtistAlbums(id),
      getArtistEvents(name),
    ]);
  } else if (id) {
    [spotifyArtist, topTracks, spotifyAlbums] = await Promise.all([
      spotifyClient.getArtist(id),
      spotifyClient.getArtistTopTracks(id),
      spotifyClient.getArtistAlbums(id),
    ]);
    [lastFmArtist, topTags, artistEvents] = await Promise.all([
      lastFMClient.getArtistInfo({ artist: spotifyArtist.name }),
      lastFMClient.getArtistTopTags(spotifyArtist.name),
      getArtistEvents(spotifyArtist.name),
    ]);
  } else if (name) {
    [lastFmArtist, [spotifyArtist], topTags, artistEvents] = await Promise.all([
      lastFMClient.getArtistInfo({ artist: name }),
      spotifyClient.searchArtists(name),
      lastFMClient.getArtistTopTags(name),
      getArtistEvents(name),
    ]);
    [topTracks, spotifyAlbums] = await Promise.all([
      spotifyClient.getArtistTopTracks(spotifyArtist.id),
      spotifyClient.getArtistAlbums(spotifyArtist.id),
    ]);
  } else {
    throw new Error('You must specify an id or name.');
  }

  // (await lastFMClient.getArtistTopAlbums(lastFmArtist.name)).forEach(a => {
  //   console.log('ALBUM: ', JSON.stringify(a, 0, 2));
  // });

  // console.log('TOP ALBUMS', (await lastFMClient.getArtistTopAlbums(lastFmArtist.name)).map(a => a.name));
  // console.log('CAL', await getArtistCalendar(lastFmArtist.mbid));

  const now = new Date();

  const releases = await MBRelease.find({ artistMbid: lastFmArtist.mbid });
  releases.sort((r1, r2) => (r1.releaseDate || now).getTime() - (r2.releaseDate || now).getTime());

  console.log(
    'REL',
    releases
      .filter(r => r.type === 'Album' && (r.subType || []).length === 0)
      .map(r => `${(r.releaseDate || now).getFullYear()} - ${r.type} - ${r.name}`)
  );

  return toArtist(lastFmArtist, spotifyArtist, topTags, topTracks, spotifyAlbums, artistEvents);
};

const toArtist = (lastFmArtist, spotifyArtist, topTags, topTracks, spotifyAlbums, artistEvents = []) => {
  // console.log('artistEvents:', artistEvents);
  // console.log('TOP TRACKS', topTracks);

  const { id, images } = spotifyArtist;
  const {
    mbid,
    name,
    bio: { content: bio },
  } = lastFmArtist;

  const albums = uniq(spotifyAlbums.map(Album.spotify), a => a.name);
  const events = artistEvents.map(artistEvent => new Event(artistEvent));

  return new Artist({
    id,
    mbid,
    name,
    bio,
    images,
    tags: topTags.map(tag => new Tag({ name: tag.name, weight: tag.count })),
    topTracks: topTracks.map(Track.spotify),
    albums,
    events,
  });
};

// http://localhost:9090/artists/7lOJ7WXyopaxri0dbOiZkd
