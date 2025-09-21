const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^dotenv/config$': '<rootDir>/test-utils/dotenv-stub.ts',
    '^jose$': '<rootDir>/node_modules/jose/dist/node/cjs/index.js',
    '^jose/(.*)$': '<rootDir>/node_modules/jose/dist/node/cjs/$1',
    '^@panva/hkdf$': '<rootDir>/node_modules/@panva/hkdf/dist/node/cjs/index.js',
    '^@panva/hkdf/(.*)$': '<rootDir>/node_modules/@panva/hkdf/dist/node/cjs/$1',
    '^preact-render-to-string$': '<rootDir>/node_modules/preact-render-to-string/dist/index.js',
    '^preact-render-to-string/(.*)$': '<rootDir>/node_modules/preact-render-to-string/dist/$1.js',
    '^preact$': '<rootDir>/node_modules/preact/dist/preact.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|openid-client|@panva/hkdf|preact-render-to-string|preact)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)
