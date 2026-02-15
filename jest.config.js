/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
            '@templates/*': ['./src/templates/*'],
            '@services/*': ['./src/services/*'],
            '@resume-types/*': ['./src/types/*'],
            '@utils/*': ['./src/utils/*'],
            '@cli/*': ['./src/cli/*'],
            '@api/*': ['./src/api/*'],
          },
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@templates/(.*)$': '<rootDir>/src/templates/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@resume-types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
  },
};
