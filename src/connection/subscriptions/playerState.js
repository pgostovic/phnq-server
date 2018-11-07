import diff from 'deep-diff';
import { Subscription } from '../subscription';
import PlayerState from '../../model/playerState';

export default class PlayerStateChange extends Subscription {
  start() {
    let playerPrev = null;
    const pid = setInterval(async () => {
      if (this.isAlive()) {
        const player = PlayerState.spotify(await this.state.spotifyClient.getPlayer());
        if (playerPrev) {
          const d = diff(playerPrev, player, (path, key) => key === 'progress_ms');
          if (d) {
            this.send('playerState', player);
          }
        }
        playerPrev = player;
      } else {
        clearInterval(pid);
      }
    }, 1000);
  }
}
