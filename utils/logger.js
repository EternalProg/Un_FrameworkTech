import config from '#config';

function shouldLog(statusCode) {
  if (config.NODE_ENV === 'development') return true;
  return statusCode >= 400;
}

function getLogLevel(statusCode) {
  if (statusCode >= 500) return 'ERROR';
  if (statusCode >= 400) return 'WARN';
  return 'INFO';
}

function logRequest(method, pathname, statusCode) {
  if (!shouldLog(statusCode)) return;
  const timestamp = new Date().toISOString();
  const level = getLogLevel(statusCode);
  const logLine = `${timestamp} | ${level} | ${method} | ${pathname} | ${statusCode}`;
  console.log(logLine);
}

export { logRequest };
