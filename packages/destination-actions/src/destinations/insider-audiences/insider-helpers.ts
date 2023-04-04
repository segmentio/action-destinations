import { ModifiedResponse, RequestOptions } from '@segment/actions-core'
import { Payload } from './insiderAudiences/generated-types'

export const API_BASE = 'https://unification.useinsider.com/api/'
export const UPSERT_ENDPOINT = 'user/v1/upsert'
export const DELETE_ATTRIBUTE_ENDPOINT = 'user/v1/attribute/delete'
const AUDIENCE_TYPE = 'audience'
const IDENTIFY = 'identify'
const TRACK = 'track'
const COMPUTED_TRAIT_TYPE = 'trait'

class PayloadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PayloadValidationError'
  }
}

// It will handle the payload for computed traits in identify call
const computedTraitsPayloadForIdentifyCall = function (
  data: Payload,
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>
) {
  const identifiers = getIdentifiers(data)
  const attributes = getTraitAttributes(data)

  const payload = {
    users: [
      {
        identifiers,
        attributes
      }
    ]
  }

  return request(API_BASE + UPSERT_ENDPOINT, {
    method: 'POST',
    json: payload
  })
}

// It will handle the payload for computed traits in track call
const computedTraitsPayloadForTrackCall = function (
  data: Payload,
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>
) {
  const identifiers = getIdentifiers(data)
  const events = getEvents(data)

  const payload = {
    users: [
      {
        identifiers,
        events
      }
    ]
  }

  return request(API_BASE + UPSERT_ENDPOINT, {
    method: 'POST',
    json: payload
  })
}

// It will handle the payload for computed audiences in identify call
const computedAudiencesPayloadForIdentifyCall = function (
  data: Payload,
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>
) {
  if (data.traits_or_props[data.custom_audience_name] === false) {
    return request(API_BASE + DELETE_ATTRIBUTE_ENDPOINT, {
      method: 'POST',
      json: deleteAttributePartial(data)
    })
  }

  const identifiers = getIdentifiers(data)
  const attributes = getAttributes(data)

  const payload = {
    users: [
      {
        identifiers,
        attributes
      }
    ]
  }

  return request(API_BASE + UPSERT_ENDPOINT, {
    method: 'POST',
    json: payload
  })
}

// It will handle the payload for computed audiences in track call
const computedAudiencePayloadForTrackCall = function (
  data: Payload,
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>
) {
  const identifiers = getIdentifiers(data)
  const events = getEvents(data)

  const payload = {
    users: [
      {
        identifiers,
        events
      }
    ]
  }

  return request(API_BASE + UPSERT_ENDPOINT, {
    method: 'POST',
    json: payload
  })
}

// It generate the payload for delete attribute. It works when a user is removed from a computed audience
const deleteAttributePartial = function (data: Payload) {
  const identifiers = getIdentifiers(data)
  const computationKey = data.custom_audience_name

  return {
    users: [
      {
        identifiers,
        custom: {
          partial: {
            segment_audience_name: [computationKey]
          }
        }
      }
    ]
  }
}

// It will return the identifiers for the user
const getIdentifiers = function (data: Payload) {
  const identifiers: { [x: string]: string | object } = {
    email: data.email
  }

  if (data.user_id) {
    identifiers['uuid'] = data.user_id
  }

  if (data.anonymous_id) {
    identifiers['custom'] = {
      segment_anonymous_id: data.anonymous_id
    }
  }

  if (data.phone) {
    identifiers['phone_number'] = data.phone
  }

  return identifiers
}

// It will return the attributes for the user
const getAttributes = function (data: Payload) {
  const computationKey = data.custom_audience_name
  const attributes = {
    custom: {
      segment_audience_name: [computationKey]
    }
  }
  return attributes
}

const getTraitAttributes = function (data: Payload) {
  const computationKey = 'segment_io_' + data.custom_audience_name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attributes: any = { custom: {} }

  attributes.custom[computationKey] = data.traits_or_props[data.custom_audience_name]

  return attributes
}

// It will return the events for the user
const getEvents = function (data: Payload) {
  return [
    {
      event_name: data.event_name?.toLowerCase().replace(/ /g, '_'),
      timestamp: data.timestamp,
      event_params: {
        custom: {
          segment_engage_name: data.custom_audience_name
        }
      }
    }
  ]
}

// It will handle the payload for computed audiences
const handleAudienceData = async function (
  data: Payload,
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>
) {
  if (data.event_type === IDENTIFY) {
    return computedAudiencesPayloadForIdentifyCall(data, request)
  }

  if (data.event_type === TRACK) {
    return computedAudiencePayloadForTrackCall(data, request)
  }

  throw new PayloadValidationError('API call must be a track() or identify() call')
}

// It will handle the payload for computed traits
const handleComputationData = async function (
  data: Payload,
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>
) {
  if (data.event_type === IDENTIFY) {
    return computedTraitsPayloadForIdentifyCall(data, request)
  }

  if (data.event_type === TRACK) {
    return computedTraitsPayloadForTrackCall(data, request)
  }

  throw new PayloadValidationError('API call must be a track() or identify() call')
}

// It will process the payload and call the respective functions
export const processPayload = async function (
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>,
  payload: Payload[]
) {
  const promises = payload.map((data) => {
    if (data.segment_computation_action === AUDIENCE_TYPE) {
      return handleAudienceData(data, request)
    }

    if (data.segment_computation_action === COMPUTED_TRAIT_TYPE) {
      return handleComputationData(data, request)
    }

    throw new PayloadValidationError('API call must be an Audience or Computed Trait track() or identify() call')
  })

  return Promise.all(promises)
}
