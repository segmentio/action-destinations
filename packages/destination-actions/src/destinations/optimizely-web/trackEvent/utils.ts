import type { Payload } from './generated-types'
import { StateContext, IntegrationError, PayloadValidationError, omit } from '@segment/actions-core'
import { UnixTimestamp13 } from './types'
import { LOCAL_TESTING, SUPPORTED_TYPES } from './constants'

export function isUnixTimestamp13(value: number): value is UnixTimestamp13 {
  return value.toString().length === 13
}

export function isPrimitive(
  value: unknown,
  typesToCheck: Array<'string' | 'boolean' | 'number'> = ['string', 'boolean', 'number']
): boolean {
  const type = typeof value
  return typesToCheck.includes(type as 'string' | 'boolean' | 'number')
}

export function areAllPropertiesPrimitive(
  obj: Record<string, unknown> | undefined,
  typesToCheck: Array<'string' | 'boolean' | 'number'> = ['string', 'boolean', 'number']
): boolean {
  if (obj === undefined || Object.keys(obj).length === 0) {
    return true
  }
  return Object.values(obj).every((value) => isPrimitive(value, typesToCheck))
}

export function validate(payload: Payload, stateContext?: StateContext) {
  const {
    eventMatching: { eventName, eventKey, eventId },
    eventType,
    tags: { value, revenue, quantity, currency, ...restTags } = {},
    timestamp,
    properties,
  } = payload

  if(!eventName && !eventKey && !eventId){
    throw new PayloadValidationError('One of eventName, eventKey or eventId is required')
  }

  if (!stateContext && !LOCAL_TESTING) {
    throw new IntegrationError('stateContext is not available', 'MISSING_STATE_CONTEXT', 400)
  }

  if(!SUPPORTED_TYPES.includes(eventType)){
    throw new PayloadValidationError(`Event type ${eventType} is not supported. Supported types are ${SUPPORTED_TYPES.join(', ')}`)
  }

  const unixTimestamp13: UnixTimestamp13 = new Date(timestamp as string).getTime() as UnixTimestamp13

  if (!isUnixTimestamp13(unixTimestamp13)) {
    throw new PayloadValidationError('Unable to convert timestamp into 13 digit Unix timestamp')
  }

  const opt_event_properties = omit(properties, ['revenue', 'value', 'quantity', 'currency'])

  if (!areAllPropertiesPrimitive(opt_event_properties, ['string', 'number', 'boolean'])) {
    throw new PayloadValidationError('Event properties must be of type string, number or boolean')
  }

  if (!areAllPropertiesPrimitive(restTags as Record<string, unknown>, ['string', 'number'])) {
    throw new PayloadValidationError('Tags must be of type string or number')
  }
  
  return {
    unixTimestamp13,
    opt_event_properties,
    value,
    revenue,
    quantity,
    currency,
    restTags
  }
}



