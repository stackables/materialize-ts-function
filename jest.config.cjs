module.exports = {
    transform: {
        "\\.[jt]sx?$": ["esbuild-jest", { format: "esm" }],
    },
    moduleFileExtensions: ["ts", "js"],
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: ["build"],
}
