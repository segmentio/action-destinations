import { Payload } from './insiderAudiences/generated-types'

export const API_BASE = 'https://unification.useinsider.com/api/'
export const UPSERT_ENDPOINT = 'user/v1/upsert'

export function computedTraitsPayloadForIdentifyCall(data: Payload) {
  const identifiers = getIdentifiers(data)
  const attributes = getAttributes(data)

  return {
    users: [
      {
        identifiers,
        attributes
      }
    ]
  }
}

export function computedTraitsPayloadForTrackCall(data: Payload) {
  const identifiers = getIdentifiers(data)
  const events = getEvents(data)

  return {
    users: [
      {
        identifiers,
        events
      }
    ]
  }
}

const getIdentifiers = function (data: Payload) {
  const identifiers = {}

  if (data.userId) {
    identifiers['uuid'] = data.userId
  }

  if (data.anonymousId) {
    identifiers['custom'] = {
      segment_anonymous_id: data.anonymousId
    }
  }

  if (data.traits.email) {
    identifiers['email'] = data.traits.email
  }

  if (data.traits.phone) {
    identifiers['phone_number'] = data.traits.phone
  }

  return identifiers
}

const getAttributes = function (data: Payload) {
  const computationKey = data.context.personas.computation_key
  const attributes = {
    custom: {}
  }

  attributes['custom'][computationKey] = data.traits[computationKey]

  return attributes
}

const getEvents = function (data: Payload) {
  return [
    {
      event_name: data.event.toLowerCase().replace(/ /g, '_'),
      timestamp: data.timestamp,
      event_params: {
        custom: {
          segment_engage_name: data.context.personas.computation_key
        }
      }
    }
  ]
}
