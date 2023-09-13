export interface Units {
  units: Record<string, unknown>
}

export interface PublishRequestUnit {
  type: string
  uid: string
}

function isUnit(value: unknown) {
  return (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'
}

export function mapUnits(payload: Units): PublishRequestUnit[] {
  return Object.entries(payload.units)
    .filter(([, uid]) => isUnit(uid))
    .map(([type, uid]) => ({
      type,
      uid: String(uid)
    }))
}
