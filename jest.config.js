module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/backend/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  clearMocks: true,
};
