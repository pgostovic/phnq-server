export default async (code, { spotifyClient }) => {
  await spotifyClient.setCode(code);
  return true;
};
