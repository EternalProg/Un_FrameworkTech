function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload, null, 2));
}

function sendError(res, statusCode, message, details) {
  const payload = { error: message };

  if (Array.isArray(details) && details.length > 0) {
    payload.details = details;
  }

  sendJson(res, statusCode, payload);
}

module.exports = {
  sendJson,
  sendError,
};
