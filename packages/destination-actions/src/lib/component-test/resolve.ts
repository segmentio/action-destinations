import { randomUUID } from 'node:crypto'
import type { CTHookValues, CTSettingsObject, CTSettingsSecretValue } from './types'

const BEFORE = '$before:'

/**
 * Recursively resolve dynamic markers in a value:
 *   '$now'           → current ISO-8601 timestamp
 *   '$guid'          → a fresh UUID v4 each occurrence
 *   '$guid:<name>'   → a UUID v4 stable within one call (same name → same value), via guidCache
 *   '$before:<key>'  → beforeValues[key]; throws when no hook returned it
 * Other strings, numbers, booleans and null pass through unchanged.
 */
export function resolveDynamicValues<T>(
  value: T,
  guidCache: Map<string, string> = new Map(),
  beforeValues: CTHookValues = {}
): T {
  if (typeof value === 'string') {
    if (value === '$now') return new Date().toISOString() as unknown as T
    if (value === '$guid') return randomUUID() as unknown as T
    if (value.startsWith(BEFORE)) {
      const key = value.slice(BEFORE.length)
      if (!(key in beforeValues)) throw new Error(`Component test: no before hook returned "${key}" (for '${value}').`)
      return beforeValues[key] as unknown as T
    }
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
    return value.map((item) => resolveDynamicValues(item, guidCache, beforeValues)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveDynamicValues(v, guidCache, beforeValues)
    }
    return out as unknown as T
  }
  return value
}

/** The '$before:<key>' keys a value references that `beforeValues` lacks. */
export function missingBeforeKeys(value: unknown, beforeValues: CTHookValues): string[] {
  const missing = new Set<string>()
  const walk = (v: unknown) => {
    if (typeof v === 'string') {
      if (v.startsWith(BEFORE) && !(v.slice(BEFORE.length) in beforeValues)) missing.add(v.slice(BEFORE.length))
    } else if (v && typeof v === 'object') {
      Object.values(v as Record<string, unknown>).forEach(walk)
    }
  }
  walk(value)
  return [...missing]
}

function isSecret(value: unknown): value is CTSettingsSecretValue {
  return !!value && typeof value === 'object' && '$env' in value
}

/** The `{ $env }` names in a settings object that `env` does not set. */
export function missingSecrets(settings: CTSettingsObject, env: NodeJS.ProcessEnv): string[] {
  const missing: string[] = []
  const walk = (obj: CTSettingsObject) => {
    for (const value of Object.values(obj)) {
      if (isSecret(value)) {
        if (!env[value.$env]) missing.push(value.$env)
      } else if (value && typeof value === 'object') {
        walk(value)
      }
    }
  }
  walk(settings)
  return missing
}

/** Resolve `{ $env: 'NAME' }` secret markers in a settings object from `env`. Throws on an unset name. */
export function resolveSettings(settings: CTSettingsObject, env: NodeJS.ProcessEnv): Record<string, unknown> {
  const resolve = (obj: CTSettingsObject): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (isSecret(value)) {
        const resolved = env[value.$env]
        if (!resolved) {
          throw new Error(
            `Component test: environment variable "${value.$env}" is not set or empty (needed for setting "${key}").`
          )
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
