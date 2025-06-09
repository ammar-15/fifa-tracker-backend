module.exports = {
preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
  '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },
  //setupFiles: ['<rootDir>/setupTests.js'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }
  },
  moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1'
},
};