import Artist from './artist';
import Tag, { Taggable } from './tag';
import Album from './album';
import Track from './track';
import Event from './event';
import PlayerState from './playerState';

const models = { Artist, Tag, Taggable, Track, Album, PlayerState, Event };

console.log('Artist hash', Object.keys(Artist.schema).sort());

Object.values(models).forEach(model => {
  model.register();
});

// console.log('MODELS', models);

// export const toModel = val => {
//   if (val instanceof Array) {
//     const arr = val;
//     return arr.map(toModel);
//   }
//   if (val && typeof val === 'object') {
//     const obj = val;
//     Object.keys(obj).forEach(k => {
//       obj[k] = toModel(obj[k]);
//     });
//     const { _c_ } = obj;
//     if (_c_) {
//       const ModelClass = models[_c_];
//       if (ModelClass) {
//         return new ModelClass(obj);
//       }
//       throw new Error(`Unknown model class: ${_c_}`);
//     }
//   }
//   return val;
// };

export default models;
