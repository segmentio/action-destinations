import fs from 'fs'
import path from 'path'

/**
 * These tests ensure that actions-shared code is environment-agnostic and doesn't
 * use browser-specific or Node.js-specific globals that would break in other environments.
 */

// Recursively find all TypeScript files in a directory
function findTypeScriptFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip test directories and node_modules
      if (!entry.name.startsWith('__') && entry.name !== 'node_modules') {
        findTypeScriptFiles(fullPath, files)
      }
    } else if (entry.isFile()) {
      // Include .ts files, exclude test files and type definitions
      if (
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.test.ts') &&
        !entry.name.endsWith('.spec.ts') &&
        !entry.name.endsWith('.d.ts')
      ) {
        files.push(fullPath)
      }
    }
  }

  return files
}

describe('Environment-specific code detection', () => {
  const srcDir = path.join(__dirname, '..')
  let sourceFiles: string[] = []

  beforeAll(() => {
    // Find all TypeScript source files (excluding test files and type definitions)
    sourceFiles = findTypeScriptFiles(srcDir)
  })

  describe('Browser-specific globals', () => {
    const browserGlobals = [
      'window',
      'document',
      'localStorage',
      'sessionStorage',
      'navigator',
      'location',
      'history',
      'fetch' // Note: fetch is now available in Node 18+, but this pattern catches direct usage
    ]

    browserGlobals.forEach((globalName) => {
      it(`should not use browser-specific global: ${globalName}`, () => {
        const violations: Array<{ file: string; line: number; content: string }> = []

        sourceFiles.forEach((file) => {
          const content = fs.readFileSync(file, 'utf-8')
          const lines = content.split('\n')

          lines.forEach((line, index) => {
            // Skip comments and imports
            if (line.trim().startsWith('//') || /^\s*\*/.test(line) || line.trim().startsWith('import')) {
              return
            }

            // Check for direct usage of the global (e.g., window.something or just window)
            const directUsagePattern = new RegExp(`\\b${globalName}\\s*[.\\[]`, 'g')
            // Check for typeof checks which are allowed for feature detection
            const typeofPattern = new RegExp(`typeof\\s+${globalName}\\s*[!=]=`, 'g')

            if (directUsagePattern.test(line) && !typeofPattern.test(line)) {
              violations.push({
                file: path.relative(srcDir, file),
                line: index + 1,
                content: line.trim()
              })
            }
          })
        })

        if (violations.length > 0) {
          const message = violations.map((v) => `  ${v.file}:${v.line}\n    ${v.content}`).join('\n\n')

          throw new Error(
            `Found ${violations.length} usage(s) of browser-specific global '${globalName}':\n\n${message}\n\n` +
              `These packages should be environment-agnostic. Consider:\n` +
              `  - Using feature detection (typeof ${globalName} !== 'undefined')\n` +
              `  - Abstracting the functionality behind an interface\n` +
              `  - Moving browser-specific code to browser-destinations package`
          )
        }
      })
    })
  })

  describe('Node.js-specific globals', () => {
    const nodeGlobals = ['process', 'Buffer', '__dirname', '__filename', 'global']

    const allowedProcessPatterns = [
      // Known exceptions should be documented here
      // isDestinationActionService checks server-side environment variables
      /engage\/utils\/isDestinationActionService\.ts.*process\.env/
    ]

    const allowedBufferPatterns = [
      // MessageSendPerformer uses Buffer for base64 encoding in server-side context
      // This should ideally use a polyfill or btoa-lite that works in both environments
      /engage\/utils\/MessageSendPerformer\.ts.*Buffer\.from/
    ]

    nodeGlobals.forEach((globalName) => {
      it(`should not use Node.js-specific global: ${globalName}`, () => {
        const violations: Array<{ file: string; line: number; content: string }> = []

        sourceFiles.forEach((file) => {
          const content = fs.readFileSync(file, 'utf-8')
          const lines = content.split('\n')

          lines.forEach((line, index) => {
            // Skip comments and imports
            if (line.trim().startsWith('//') || /^\s*\*/.test(line) || line.trim().startsWith('import')) {
              return
            }

            // Check for direct usage of the global
            const directUsagePattern = new RegExp(`\\b${globalName}\\s*[.\\[]`, 'g')
            // Check for typeof checks which are allowed for feature detection
            const typeofPattern = new RegExp(`typeof\\s+${globalName}\\s*[!=]=`, 'g')
            // Check for globalThis.process which is safer
            const globalThisPattern = new RegExp(`globalThis\\.${globalName}`, 'g')

            const relativePath = path.relative(srcDir, file)
            const locationString = `${relativePath}:${index + 1}:${line}`

            // Check if this is an allowed exception
            const allowedPatterns =
              globalName === 'process' ? allowedProcessPatterns : globalName === 'Buffer' ? allowedBufferPatterns : []
            const isAllowedException = allowedPatterns.some((pattern) => pattern.test(locationString))

            // For process and Buffer, allow globalThis.{globalName} usage
            const isGlobalThisUsage =
              (globalName === 'process' || globalName === 'Buffer') && globalThisPattern.test(line)

            if (
              directUsagePattern.test(line) &&
              !typeofPattern.test(line) &&
              !isGlobalThisUsage &&
              !isAllowedException
            ) {
              violations.push({
                file: relativePath,
                line: index + 1,
                content: line.trim()
              })
            }
          })
        })

        if (violations.length > 0) {
          const message = violations.map((v) => `  ${v.file}:${v.line}\n    ${v.content}`).join('\n\n')

          throw new Error(
            `Found ${violations.length} usage(s) of Node.js-specific global '${globalName}':\n\n${message}\n\n` +
              `These packages should be environment-agnostic. Consider:\n` +
              `  - Using 'globalThis.${globalName}' with proper checks\n` +
              `  - Using feature detection (typeof globalThis.${globalName} !== 'undefined')\n` +
              `  - Abstracting the functionality behind an interface\n` +
              `  - Moving Node.js-specific code to destination-actions package`
          )
        }
      })
    })
  })

  describe('Require/import checks', () => {
    it('should not use require() for Node.js built-in modules', () => {
      const nodeBuiltins = ['fs', 'path', 'http', 'https', 'crypto', 'os', 'stream', 'util', 'events']
      const violations: Array<{ file: string; line: number; content: string }> = []

      sourceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          nodeBuiltins.forEach((builtin) => {
            // Check for require('builtin') or import from 'builtin'
            const requirePattern = new RegExp(`require\\s*\\(\\s*['"]${builtin}['"]\\s*\\)`, 'g')
            const importPattern = new RegExp(`import\\s+.*\\s+from\\s+['"]${builtin}['"]`, 'g')

            if (requirePattern.test(line) || importPattern.test(line)) {
              // Skip type-only imports
              if (line.includes('import type')) {
                return
              }

              violations.push({
                file: path.relative(srcDir, file),
                line: index + 1,
                content: line.trim()
              })
            }
          })
        })
      })

      if (violations.length > 0) {
        const message = violations.map((v) => `  ${v.file}:${v.line}\n    ${v.content}`).join('\n\n')

        throw new Error(
          `Found ${violations.length} import(s) of Node.js built-in modules:\n\n${message}\n\n` +
            `These packages should be environment-agnostic and not depend on Node.js built-ins.`
        )
      }
    })
  })

  describe('Environment detection patterns', () => {
    it('should use safe environment detection patterns', () => {
      const violations: Array<{ file: string; line: number; content: string; issue: string }> = []

      sourceFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          // Skip comments
          if (line.trim().startsWith('//') || /^\s*\*/.test(line)) {
            return
          }

          // Unsafe pattern: direct process usage without checks
          // Good: typeof globalThis.process !== 'undefined'
          // Bad: if (process) or if (process.env)
          const unsafeProcessCheck = /\bif\s*\(\s*process[.[]/.test(line)
          if (unsafeProcessCheck && !/globalThis\.process/.test(line) && !/typeof/.test(line)) {
            violations.push({
              file: path.relative(srcDir, file),
              line: index + 1,
              content: line.trim(),
              issue: 'Direct process check without typeof or globalThis'
            })
          }

          // Unsafe pattern: direct window usage without checks
          const unsafeWindowCheck = /\bif\s*\(\s*window[.[]/.test(line)
          if (unsafeWindowCheck && !/typeof/.test(line)) {
            violations.push({
              file: path.relative(srcDir, file),
              line: index + 1,
              content: line.trim(),
              issue: 'Direct window check without typeof'
            })
          }
        })
      })

      if (violations.length > 0) {
        const message = violations.map((v) => `  ${v.file}:${v.line} - ${v.issue}\n    ${v.content}`).join('\n\n')

        throw new Error(
          `Found ${violations.length} unsafe environment detection pattern(s):\n\n${message}\n\n` +
            `Always use safe feature detection:\n` +
            `  - typeof globalThis.process !== 'undefined'\n` +
            `  - typeof window !== 'undefined'\n` +
            `  - typeof globalThis.process?.env === 'object'`
        )
      }
    })
  })
})
