process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

if (!process.env.RUN_INTEGRATION) {
  process.env.RUN_INTEGRATION = '0';
}
