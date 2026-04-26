import { Transform } from 'node:stream';

class SmartHomeActiveTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(item, _encoding, callback) {
    callback(null, {
      ...item,
      isActive: item.status === 'on',
    });
  }
}

export { SmartHomeActiveTransform };
