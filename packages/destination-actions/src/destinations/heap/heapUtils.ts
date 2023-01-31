import { IntegrationError } from '@segment/actions-core'
import { Payload } from './trackEvent/generated-types'

export const getUserIdentifier = ({
  identity,
  anonymous_id
}: {
  identity?: string | null
  anonymous_id?: string | null
}): { [k: string]: string } => {
  if (identity) {
    return {
      identity
    }
  }

  if (anonymous_id) {
    return {
      anonymous_id
    }
  }
  throw new IntegrationError('Either identity or anonymous id are required.')
}

export const getEventName = (payload: Payload) => {
  let eventName: string | undefined
  switch (payload.type) {
    case 'track':
      eventName = payload.event
      break
    case 'page':
      eventName = payload.name ? payload.name : 'Page Viewed'
      break
    case 'screen':
      eventName = payload.name ? payload.name : 'Screen Viewed'
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
