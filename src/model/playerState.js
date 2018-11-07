import { Model, instanceOf, number, bool } from 'phnq-lib';
import Track from './track';

class PlayerState extends Model {
  static schema = {
    track: instanceOf(Track),
    progress: number,
    isPlaying: bool,
  };

  static spotify({ item, progress_ms: progress, is_playing: isPlaying } = {}) {
    return new PlayerState({
      track: Track.spotify(item),
      progress,
      isPlaying,
    });
  }
}

export default PlayerState;
