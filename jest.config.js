module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: ['src/**/*.js', '!src/cli/index.js', '!src/**/*.test.js', '!src/**/__tests__/**'],
    coverageThreshold: {
        global: {
            branches: 14,
            functions: 24,
            lines: 24,
            statements: 24
        }
    },
    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    testTimeout: 15000,
    collectCoverage: false,
    maxWorkers: '50%',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(chalk|execa|strip-final-newline|npm-run-path|path-key|onetime|mimic-fn|human-signals|is-stream|get-stream|merge-stream)/)'
    ]
};
