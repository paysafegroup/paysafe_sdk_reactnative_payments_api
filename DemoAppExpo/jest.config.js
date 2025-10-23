module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Adjust this pattern if you see transform errors from more node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-paper|react-native-vector-icons|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|expo|@expo)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
  },
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@sdk$': '<rootDir>/src/sdk/index.ts',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@components/(.*)$': '<rootDir>/components/$1'
  },
  testEnvironment: 'jsdom',
  // Coverage options (supported by Jest)
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'constants/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!app/**/*.test.{js,jsx,ts,tsx}',
    '!app/**/__tests__/**',
    '!components/**/*.test.{js,jsx,ts,tsx}',
    '!components/**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/*.setup.{js,ts}',
    '!**/build/**',
    '!**/dist/**',
  ],
  coverageDirectory: '<rootDir>/../tests-report/coverage-demo',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  // Supported Jest options
  clearMocks: true,
  maxWorkers: '50%',
  // The following options are not recognized by Jest 29+ and should be set via CLI or reporters:
  // testResultsProcessor: "jest-junit",
  // verbose: true,
};