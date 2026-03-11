function readBody(req, cb) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      cb(null, body ? JSON.parse(body) : {});
    } catch {
      cb('Invalid JSON');
    }
  });
}

module.exports = {
  readBody,
};
