import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/test-env.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'services/**/*.js',
        'src/models/**/*.js',
        'src/transforms/**/*.js',
        'src/utils/**/*.js',
        'constants/redis-keys.js',
      ],
      exclude: ['tests/**', 'services/github.service.js', 'src/utils/backup.utils.js'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
