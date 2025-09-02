import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.mock.ts',
    '!src/common/filters/**',
    '!src/common/pipes/**',
    '!src/common/middleware/**',
    '!src/common/decorators/**',
    '!src/database/migrations/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
};

export default config;
