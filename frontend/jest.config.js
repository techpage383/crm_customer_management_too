/**
 * Jest設定ファイル
 * 統合テスト環境の設定
 */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['react-app'] }],
  },
  testMatch: [
    '<rootDir>/src/tests/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/tests/integration/**/*.test.(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/tests/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  maxWorkers: 1,
  verbose: true,
  displayName: 'Frontend Integration Tests',
};