import { LeadRef, ValueMap } from './api'

type EventPayload = {
  userId?: string
  anonymousId?: string
  email?: string
}

export const convertLeadRefs = (payload: EventPayload): LeadRef[] => {
  const refs: LeadRef[] = []
  if (payload.userId) refs.push({ type: 'client-id', value: payload.userId })
  if (payload.anonymousId) refs.push({ type: 'client-id', value: payload.anonymousId })
  if (payload.email) refs.push({ type: 'email', value: payload.email })
  return refs
}

export const convertValues = (source: { [k: string]: unknown } | undefined): ValueMap => {
  const values: ValueMap = {}
  if (!source) return values
  Object.entries(source).forEach(([key, prop]) => {
    if (typeof prop === 'number' || typeof prop === 'boolean' || typeof prop === 'string') values[key] = prop
  })
  return values
}

export const convertTimestamp = (timestamp: any): number => {
  if (!timestamp) return Date.now()
  if (typeof timestamp === 'number') return timestamp
  return Date.parse(timestamp)
}
