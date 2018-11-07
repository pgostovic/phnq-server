import fetch from 'cross-fetch';

const imgRe = /<li class="image-list-item">\s*<a href="\/music\/[^/]*\/\+images\/([^"]*)"/g;

export default async ({ name }) => {
  const imgUrls = [];
  const resp = await (await fetch(`https://www.last.fm/music/${encodeURIComponent(name)}/+images`)).text();

  let m;
  do {
    m = imgRe.exec(resp);
    if (m) {
      imgUrls.push(`https://lastfm-img2.akamaized.net/i/u/770x0/${m[1]}.jpg`);
    }
  } while (m);

  return imgUrls;
};
