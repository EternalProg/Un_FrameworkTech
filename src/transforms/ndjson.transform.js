import { Transform } from 'node:stream';

class NdjsonTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(item, _encoding, callback) {
    callback(null, `${JSON.stringify(item)}\n`);
  }
}

export { NdjsonTransform };
