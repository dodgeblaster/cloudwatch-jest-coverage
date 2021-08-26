module.exports = {
    testEnvironment: 'node',
    silent: false,
    collectCoverageFrom: ['./src/**/*.{js,jsx}'],
    reporters: ['default', './testReporter/index.js'],
    coverageReporters: ['json-summary']
}
