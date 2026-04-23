module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native(?!.*node_modules)|@react-native-community|@react-navigation|react-native-safe-area-context|react-native-paper|react-native-vector-icons)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/paysafe-payments-sdk-common/src/**/*.{ts,tsx}',
    'packages/paysafe-venmo/src/**/*.{ts,tsx}',
    'packages/paysafe-google-pay/src/**/*.{ts,tsx}',
    'packages/paysafe-card-payments/src/**/*.{ts,tsx}',
    'packages/paysafe-apple-pay/src/**/*.{ts,tsx}',
    'DemoAppExpo/src/**/*.{ts,tsx}',
    'DemoAppExpo/components/**/*.{ts,tsx}',
    'DemoAppExpo/hooks/**/*.{ts,tsx}',
    'DemoAppExpo/constants/**/*.{ts,tsx}',
    'DemoAppExpo/styles/**/*.{ts,tsx}',
    'DemoAppExpo/app/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/scripts/**',
    '!**/app/**/payments.tsx',
    // Platform-specific UI duplicates; covered by native/E2E, not jsdom unit tests
    '!**/DemoAppExpo/components/ui/*.ios.tsx',
    '!**/jest/mocks/**',
  ],
  coveragePathIgnorePatterns: ['<rootDir>/jest/mocks/'],
  coverageDirectory: '<rootDir>/tests-report/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json', 'cobertura', 'html'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testResultsProcessor: "jest-junit",
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg|webp|ttf|otf|woff2?)$': '<rootDir>/jest/mocks/fileMock.js',
    '^react-native-reanimated$': '<rootDir>/jest/mocks/reanimatedMock.js',
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^react-native/(.*)$': '<rootDir>/node_modules/react-native/$1',
    '^@react-native/(.*)$': '<rootDir>/node_modules/@react-native/$1',
    '^@paysafe/paysafe-payments-sdk-common$': '<rootDir>/packages/paysafe-payments-sdk-common/src',
    '^@paysafe/paysafe-venmo$': '<rootDir>/packages/paysafe-venmo/src',
    '^@paysafe/paysafe-google-pay$': '<rootDir>/packages/paysafe-google-pay/src',
    '^@paysafe/paysafe-card-payments$': '<rootDir>/packages/paysafe-card-payments/src',
    '^@paysafe/react-native-paysafe-apple-pay$': '<rootDir>/packages/paysafe-apple-pay/src',
    '^@/(.*)$': '<rootDir>/DemoAppExpo/$1',
    '^@components/(.*)$': '<rootDir>/DemoAppExpo/components/$1',
    '^@hooks/(.*)$': '<rootDir>/DemoAppExpo/hooks/$1',
    '^@constants/(.*)$': '<rootDir>/DemoAppExpo/constants/$1',
    '^@/components/ui/IconSymbol$': '<rootDir>/DemoAppExpo/components/ui/IconSymbol.tsx',
    '^@/components/ui/TabBarBackground$': '<rootDir>/DemoAppExpo/components/ui/TabBarBackground.tsx',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        allowJs: true,
      },
      // Avoid typechecking node_modules (e.g. react-native-reanimated .tsx) when collecting coverage
      diagnostics: false,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/packages/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/packages/**/?(*.)+(spec|test).{ts,tsx}',
    '<rootDir>/DemoAppExpo/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/DemoAppExpo/**/?(*.)+(spec|test).{ts,tsx}'
  ],
  clearMocks: true,
  maxWorkers: '50%',
  modulePathIgnorePatterns: ["<rootDir>/dist/"]
};
