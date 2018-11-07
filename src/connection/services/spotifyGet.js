export default async ({ path, params }, { spotifyClient }) => spotifyClient.get(path, params);
