export default {
  test: {
    include: ['tests/**/*.test.js'],
    pool: 'forks',
    threads: false,
    isolate: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: ['bench/**', 'examples/**', 'tests/**', 'dist/**', '.github/**', 'bin/**'],
      lines: 85,
      functions: 85,
      branches: 75,
      statements: 85,
    },
  },
};
