module.exports = {
    transform: {
        "\\.[jt]sx?$": ["esbuild-jest"],
    },
    moduleFileExtensions: ["ts", "js"],
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: ["build"],
}
