const swcTransformer = require('@swc/jest').createTransformer()

module.exports = {
  process(src, filename, config, transformOptions) {
    const result = swcTransformer.process(src, filename, config, transformOptions)
    const code = typeof result === 'string' ? result : result.code
    // Make SWC's named export getters configurable so jest.spyOn works on namespace imports.
    // SWC emits Object.defineProperty with { enumerable: true, get: ... } (no configurable),
    // which defaults to configurable: false and prevents jest.spyOn from replacing the property.
    // This covers both direct exports and the _export() helper used for re-exports.
    const patched = code.replace(
      /Object\.defineProperty\((exports|target), (?!"__esModule")([^,]+), \{\s*enumerable:\s*true,\s*get:/g,
      'Object.defineProperty($1, $2, { enumerable: true, configurable: true, get:'
    )
    if (typeof result === 'string') return patched
    return { ...result, code: patched }
  }
}
