import { Payload } from './generated-types'
import { Event, EventBatch, LeadRef, PageVisitEvent, TrackingEvent, ValueMap } from '../api'

export const convertEvent = (payload: Payload): Event | undefined => {
  switch (payload.type) {
    case 'track':
      return convertTrackEvent(payload)
    case 'page':
      return convertPageEvent(payload)
    case 'identify':
      return convertIdentifyEvent(payload)
    case 'screen':
      return convertScreenEvent(payload)
    default:
      return undefined
  }
}

export const convertEventBatch = (payloads: Payload[]): EventBatch | undefined => {
  const events = payloads.map(convertEvent).filter((evt) => evt) as Event[]
  if (events.length == 0) return undefined
  return { events }
}

const convertTrackEvent = (payload: Payload): TrackingEvent | undefined => {
  if (!payload.eventName) return undefined

  const leadRefs = convertLeadRefs(payload)
  if (leadRefs.length == 0) return undefined

  const mappedProperty = payload.customEventPropertyMapping?.[payload.eventName] as string | undefined
  const mappedPropertyValue = mappedProperty ? (payload.properties?.[mappedProperty] as string | undefined) : undefined
  const [kind, data] = mappedPropertyValue ? [payload.eventName, mappedPropertyValue] : ['Track', payload.eventName]
  return new TrackingEvent({
    leadRefs,
    kind,
    data,
    url: payload.contextUrl,
    referrerUrl: payload.contextReferrerUrl,
    userAgent: payload.userAgent,
    timestamp: convertTimestamp(payload),
    values: convertValues(payload.properties)
  })
}

const convertPageEvent = (payload: Payload): PageVisitEvent | undefined => {
  if (!payload.url) return undefined

  const leadRefs = convertLeadRefs(payload)
  if (leadRefs.length == 0) return undefined

  return new PageVisitEvent({
    leadRefs,
    url: payload.url,
    referrerUrl: payload.referrerUrl,
    userAgent: payload.userAgent,
    timestamp: convertTimestamp(payload)
  })
}

const convertIdentifyEvent = (payload: Payload): TrackingEvent | undefined => {
  if (!payload.email) return undefined

  const leadRefs = convertLeadRefs(payload)
  if (leadRefs.length == 0) return undefined

  return new TrackingEvent({
    leadRefs,
    kind: 'Identify',
    data: payload.email,
    url: payload.contextUrl,
    referrerUrl: payload.contextReferrerUrl,
    userAgent: payload.userAgent,
    timestamp: convertTimestamp(payload),
    values: convertValues(payload.traits)
  })
}

const convertScreenEvent = (payload: Payload): TrackingEvent | undefined => {
  if (!payload.screenName) return undefined

  const leadRefs = convertLeadRefs(payload)
  if (leadRefs.length == 0) return undefined

  return new TrackingEvent({
    leadRefs,
    kind: 'Screen',
    data: payload.screenName,
    url: payload.contextUrl,
    referrerUrl: payload.contextReferrerUrl,
    userAgent: payload.userAgent,
    timestamp: convertTimestamp(payload),
    values: convertValues(payload.properties)
  })
}

const convertLeadRefs = (payload: Payload): LeadRef[] => {
  const refs: LeadRef[] = []
  if (payload.userId) refs.push({ type: 'client-id', value: payload.userId })
  if (payload.anonymousId) refs.push({ type: 'client-id', value: payload.anonymousId })
  if (payload.email) {
    refs.push({ type: 'email', value: payload.email })
    if (payload.traits) delete payload.traits['email']
    if (payload.properties) delete payload.properties['email']
  }
  return refs
}

const convertValues = (source: { [k: string]: unknown } | undefined): ValueMap => {
  const values: ValueMap = {}
  if (!source) return values
  Object.entries(source).forEach(([key, prop]) => {
    if (typeof prop === 'number' || typeof prop === 'boolean' || typeof prop === 'string') values[key] = prop
  })
  return values
}

const convertTimestamp = (payload: Payload): number => {
  if (!payload.timestamp) return Date.now()
  if (typeof payload.timestamp === 'number') return payload.timestamp
  return Date.parse(payload.timestamp)
}
