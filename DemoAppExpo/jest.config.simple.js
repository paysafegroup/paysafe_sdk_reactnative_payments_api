// A simplified Jest configuration for basic tests
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/simple.test.js',
    '<rootDir>/__tests__/sdk-basic.test.js',
    '<rootDir>/__tests__/basic.test.js'
  ],
  verbose: true
};