export default {
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    threads: false,
    pool: 'forks',
    isolate: false,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
};
