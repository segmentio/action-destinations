/**
 * Structural differ for normalized API responses.
 *
 * Compares two normalized response objects and produces a human-readable
 * diff highlighting added, removed, or changed fields.
 */

export interface DiffResult {
  hasDiff: boolean
  statusChanged: boolean
  changes: Change[]
}

export interface Change {
  type: 'added' | 'removed' | 'changed'
  path: string
  stable?: unknown
  canary?: unknown
}

export function diff(stable: unknown, canary: unknown, path = ''): Change[] {
  const changes: Change[] = []

  if (stable === canary) return changes

  // Both primitives but different values (after normalization, this means
  // a structural difference — e.g. a field changed from string to number)
  if (typeof stable !== 'object' || typeof canary !== 'object' || stable === null || canary === null) {
    if (typeof stable !== typeof canary) {
      changes.push({ type: 'changed', path, stable, canary })
    }
    // Same type, different normalized values = acceptable (e.g. two <string>s)
    return changes
  }

  if (Array.isArray(stable) && Array.isArray(canary)) {
    // For arrays: compare element shapes using the first element as representative
    const stableFirst = stable[0]
    const canaryFirst = canary[0]
    if (stableFirst !== undefined || canaryFirst !== undefined) {
      changes.push(...diff(stableFirst, canaryFirst, `${path}[0]`))
    }
    return changes
  }

  if (Array.isArray(stable) !== Array.isArray(canary)) {
    changes.push({ type: 'changed', path, stable: 'array', canary: typeof canary })
    return changes
  }

  const stableObj = stable as Record<string, unknown>
  const canaryObj = canary as Record<string, unknown>

  const allKeys = new Set([...Object.keys(stableObj), ...Object.keys(canaryObj)])

  for (const key of allKeys) {
    const childPath = path ? `${path}.${key}` : key
    const inStable = Object.prototype.hasOwnProperty.call(stableObj, key)
    const inCanary = Object.prototype.hasOwnProperty.call(canaryObj, key)

    if (inStable && !inCanary) {
      changes.push({ type: 'removed', path: childPath, stable: stableObj[key] })
    } else if (!inStable && inCanary) {
      changes.push({ type: 'added', path: childPath, canary: canaryObj[key] })
    } else {
      changes.push(...diff(stableObj[key], canaryObj[key], childPath))
    }
  }

  return changes
}

export function diffResponses(
  stableStatus: number,
  stableBody: unknown,
  canaryStatus: number,
  canaryBody: unknown
): DiffResult {
  const statusChanged = stableStatus !== canaryStatus
  const bodyChanges = diff(stableBody, canaryBody)

  return {
    hasDiff: statusChanged || bodyChanges.length > 0,
    statusChanged,
    changes: bodyChanges
  }
}

export function formatDiff(result: DiffResult, stableStatus: number, canaryStatus: number): string {
  if (!result.hasDiff) return '  ✅ No structural differences'

  const lines: string[] = []

  if (result.statusChanged) {
    lines.push(`  ⚠️  Status code changed: ${stableStatus} → ${canaryStatus}`)
  }

  for (const change of result.changes) {
    if (change.type === 'added') {
      lines.push(`  + added:   ${change.path}`)
    } else if (change.type === 'removed') {
      lines.push(`  - removed: ${change.path}`)
    } else if (change.type === 'changed') {
      lines.push(`  ~ changed: ${change.path} (${JSON.stringify(change.stable)} → ${JSON.stringify(change.canary)})`)
    }
  }

  return lines.join('\n')
}
