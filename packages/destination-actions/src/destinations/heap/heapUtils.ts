import { IntegrationError } from '@segment/actions-core'
import { Payload } from './trackEvent/generated-types'

export const getUserIdentifier = ({
  identity,
  anonymous_id
}: {
  identity?: string | null
  anonymous_id?: string | null
}): { [k: string]: string } => {
  if (identity && isDefined(identity)) {
    return {
      identity
    }
  }

  if (anonymous_id && isDefined(anonymous_id)) {
    return {
      anonymous_id
    }
  }
  throw new IntegrationError('Either identity or anonymous id are required.')
}

export const isDefined = (value: string | undefined | null | number | object): boolean => {
  if (typeof value === 'object') {
    return !!value && Object.keys(value).length !== 0
  }
  return !(value === undefined || value === null || value === '' || value === 0 || value === '0')
}

export const getEventName = (payload: Payload) => {
  let eventName: string | undefined
  switch (payload.type) {
    case 'track':
      eventName = payload.event
      break
    case 'page':
      eventName = 'Page viewed'
      break
    case 'screen':
      eventName = 'Screen viewed'
      break
    default:
      eventName = 'track'
      break
  }

  if (!eventName) {
    return 'track'
  }
  return eventName
}
