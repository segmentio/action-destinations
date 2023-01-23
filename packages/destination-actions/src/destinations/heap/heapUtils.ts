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
  switch (payload.type) {
    case 'track':
      return payload.event
    case 'page':
    case 'screen':
      return payload.name
    default:
      return undefined
  }
}
