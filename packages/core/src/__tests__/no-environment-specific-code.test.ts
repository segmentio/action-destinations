import fs from 'fs'
import path from 'path'

/**
 * These tests ensure that actions-core code is environment-agnostic and doesn't
 * use browser-specific or Node.js-specific globals that would break in other environments.
 *
 * The core package is used by both server-side (destination-actions) and client-side
 * (browser-destinations) code, so it must be portable across environments.
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

describe('Environment-specific code detection in actions-core', () => {
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
      'fetch'
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
              `actions-core must be environment-agnostic. Consider:\n` +
              `  - Using feature detection (typeof ${globalName} !== 'undefined')\n` +
              `  - Abstracting the functionality behind an interface\n` +
              `  - Moving browser-specific code to browser-destination-runtime package`
          )
        }
      })
    })
  })

  describe('Node.js-specific globals', () => {
    const nodeGlobals = ['process', 'Buffer', '__dirname', '__filename', 'global']

    const allowedPatterns: Record<string, RegExp[]> = {
      // Known exceptions with documentation
      process: [
        // time.ts uses process.hrtime which is acceptable as it's only used server-side
        /time\.ts.*process\.hrtime/,
        // request-client.ts uses globalThis.process.env for configuration
        /request-client\.ts.*globalThis\.process\.env/
      ],
      Buffer: [],
      __dirname: [],
      __filename: [],
      global: []
    }

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
            const typeofPattern = new RegExp(`typeof\\s+(globalThis\\.)?${globalName}\\s*[!=]=`, 'g')
            // Check for globalThis.process which is safer
            const globalThisPattern = new RegExp(`globalThis\\.${globalName}`, 'g')

            const relativePath = path.relative(srcDir, file)
            const locationString = `${relativePath}:${index + 1}:${line}`

            // Check if this is an allowed exception
            const allowedForGlobal = allowedPatterns[globalName] || []
            const isAllowedException = allowedForGlobal.some((pattern) => pattern.test(locationString))

            // For process, allow globalThis.process usage
            const isGlobalThisUsage = globalName === 'process' && globalThisPattern.test(line)

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
              `actions-core must be environment-agnostic. Consider:\n` +
              `  - Using 'globalThis.${globalName}' with proper typeof checks\n` +
              `  - Using feature detection (typeof globalThis.${globalName} !== 'undefined')\n` +
              `  - Abstracting the functionality behind an interface\n` +
              `  - Moving Node.js-specific code to destination-actions package\n\n` +
              `If this usage is intentional and only for server-side, add it to allowedPatterns in this test.`
          )
        }
      })
    })
  })

  describe('Require/import checks', () => {
    it('should not use require() for Node.js built-in modules', () => {
      const nodeBuiltins = ['fs', 'path', 'http', 'https', 'os', 'stream', 'util', 'events', 'child_process', 'crypto']
      const violations: Array<{ file: string; line: number; content: string }> = []

      const allowedImports: Record<string, RegExp[]> = {
        // EventEmitter import in action.ts is a known issue - this file is server-side only
        // but should ideally use an environment-agnostic event emitter
        events: [/destination-kit\/action\.ts.*import.*EventEmitter.*from 'events'/]
      }

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

              const relativePath = path.relative(srcDir, file)
              const locationString = `${relativePath}:${index + 1}:${line}`

              // Check if this is an allowed exception
              const allowedForBuiltin = allowedImports[builtin] || []
              const isAllowedException = allowedForBuiltin.some((pattern) => pattern.test(locationString))

              if (!isAllowedException) {
                violations.push({
                  file: relativePath,
                  line: index + 1,
                  content: line.trim()
                })
              }
            }
          })
        })
      })

      if (violations.length > 0) {
        const message = violations.map((v) => `  ${v.file}:${v.line}\n    ${v.content}`).join('\n\n')

        throw new Error(
          `Found ${violations.length} import(s) of Node.js built-in modules:\n\n${message}\n\n` +
            `actions-core should be environment-agnostic and not depend on Node.js built-ins.\n` +
            `Type-only imports are acceptable (use 'import type').`
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
