import { randomUUID } from 'node:crypto'
import type { E2ESettingsObject, E2ESettingsSecretValue } from './types'

/**
 * Recursively resolve dynamic markers in a value:
 *   '$now'          → current ISO-8601 timestamp
 *   '$guid'         → a fresh UUID v4 each occurrence
 *   '$guid:<name>'  → a UUID v4 stable within one call (same name → same value), via guidCache
 * Other strings, numbers, booleans and null pass through unchanged.
 */
export function resolveDynamicValues<T>(value: T, guidCache: Map<string, string> = new Map()): T {
  if (typeof value === 'string') {
    if (value === '$now') return new Date().toISOString() as unknown as T
    if (value === '$guid') return randomUUID() as unknown as T
    if (value.startsWith('$guid:')) {
      const key = value.slice('$guid:'.length)
      let cached = guidCache.get(key)
      if (!cached) {
        cached = randomUUID()
        guidCache.set(key, cached)
      }
      return cached as unknown as T
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveDynamicValues(item, guidCache)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveDynamicValues(v, guidCache)
    }
    return out as unknown as T
  }
  return value
}

function isSecret(value: unknown): value is E2ESettingsSecretValue {
  return !!value && typeof value === 'object' && '$env' in value
}

/** The `{ $env }` names in a settings object that `env` does not set. */
export function missingSecrets(settings: E2ESettingsObject, env: NodeJS.ProcessEnv): string[] {
  const missing: string[] = []
  const walk = (obj: E2ESettingsObject) => {
    for (const value of Object.values(obj)) {
      if (isSecret(value)) {
        if (env[value.$env] === undefined) missing.push(value.$env)
      } else if (value && typeof value === 'object') {
        walk(value)
      }
    }
  }
  walk(settings)
  return missing
}

/** Resolve `{ $env: 'NAME' }` secret markers in a settings object from `env`. Throws on an unset name. */
export function resolveSettings(settings: E2ESettingsObject, env: NodeJS.ProcessEnv): Record<string, unknown> {
  const resolve = (obj: E2ESettingsObject): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (isSecret(value)) {
        const resolved = env[value.$env]
        if (resolved === undefined) {
          throw new Error(`E2E: environment variable "${value.$env}" is not set (needed for setting "${key}").`)
        }
        out[key] = resolved
      } else if (value && typeof value === 'object') {
        out[key] = resolve(value)
      } else {
        out[key] = value
      }
    }
    return out
  }
  return resolve(settings)
}
