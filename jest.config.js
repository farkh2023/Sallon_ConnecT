module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/backend/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
  ],
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  clearMocks: true,
  // Séquentiel pour éviter les conflits d'écriture sur les fichiers runtime partagés
  maxWorkers: 1,
};
