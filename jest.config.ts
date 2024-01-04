export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.integration-test.ts',
    '**/*.integration-spec.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
};
