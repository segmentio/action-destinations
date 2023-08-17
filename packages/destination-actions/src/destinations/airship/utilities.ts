import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Payload as CustomEventsPayload } from './customEvents/generated-types'
import { Payload as AttributesPayload } from './setAttributes/generated-types'
import { Payload as TagsPayload } from './manageTags/generated-types'

// exported Action function
export function setCustomEvent(request: RequestClient, settings: Settings, payload: CustomEventsPayload) {
  const endpoint = map_endpoint(settings.endpoint)
  const uri = `${endpoint}/api/custom-events`
  const airship_payload = _build_custom_event_object(payload)
  return do_request(request, uri, [airship_payload])
}

// exported Action function
export function setBatchCustomEvent(request: RequestClient, settings: Settings, payloads: CustomEventsPayload[]) {
  const endpoint = map_endpoint(settings.endpoint)
  const uri = `${endpoint}/api/custom-events`
  const airship_payload = []
  for (let i = 0; i < payloads.length; i++) {
    airship_payload.push(_build_custom_event_object(payloads[i]))
  }
  return do_request(request, uri, airship_payload)
}

// exported Action function
export function setAttribute(request: RequestClient, settings: Settings, payload: AttributesPayload) {
  const endpoint = map_endpoint(settings.endpoint)
  const uri = `${endpoint}/api/channels/attributes`
  const attributes = _build_attributes_object(payload)
  const airship_payload = {
    attributes: attributes,
    audience: {
      named_user_id: `${payload.named_user_id}`
    }
  }
  return do_request(request, uri, airship_payload)
}

// exported Action function
export function manageTags(request: RequestClient, settings: Settings, payload: TagsPayload) {
  const endpoint = map_endpoint(settings.endpoint)
  const uri = `${endpoint}/api/named_users/tags`
  const airship_payload = _build_tags_object(payload)
  return do_request(request, uri, airship_payload)
}

function do_request(request: RequestClient, uri: string, payload: object) {
  return request(uri, {
    method: 'POST',
    json: payload
  })
}

export function map_endpoint(region: string) {
  if (region === 'EU') {
    return 'https://go.airship.eu'
  } else {
    return 'https://go.urbanairship.com'
  }
}

function _build_custom_event_object(payload: CustomEventsPayload): object {
  /*
  This function takes a Track payload and builds a Custom Event payload.
  It adds the `source: 'Segment'` property and validates the occurred timestamp but doesn't
  do much else in terms of validation. Traits line up pretty well with Custom Event properties.
  */
  if (payload.properties) {
    payload.properties.source = 'Segment'
  } else {
    payload.properties = {
      source: 'Segment'
    }
  }
  const airship_payload = {
    occurred: validate_timestamp(payload.occurred),
    user: {
      named_user_id: payload.named_user_id
    },
    body: {
      name: payload.name.toLowerCase(),
      interaction_type: 'cdp',
      properties: payload.properties
    }
  }
  return airship_payload
}

function _build_attributes_object(payload: AttributesPayload): object {
  /*
  This function takes an Identify event and builds an Attributes payload. If the value of a trait is an empty string, we assume the intention is to remove the
  attribute from the given user.
  */
  const attributes_list = []
  const attributes = payload.attributes || {}
  for (const key in attributes) {
    // if trait value is empty string, remove attribute, otherwise set it
    attributes_list.push(_build_attribute(key, attributes[key], payload.occurred))
  }
  return attributes_list
}

function _build_attribute(attribute_key: string, attribute_value: any, occurred: string | number) {
  /*
  This function builds a single attribute from a key/value.
  */
  let adjustedDate = null
  if (typeof attribute_value == 'string') {
    adjustedDate = parse_date(attribute_value)
  }

  const attribute: {
    action: string
    key: string
    value?: string | number | boolean
    timestamp: string | boolean
  } = {
    action: 'set',
    key: attribute_key,
    timestamp: validate_timestamp(occurred)
  }

  if (attribute_value == null || (typeof attribute_value == 'string' && attribute_value.length === 0)) {
    attribute.action = 'remove'
  } else if (adjustedDate !== null) {
    attribute.action = 'set'
    attribute.value = adjustedDate.toISOString().split('.')[0]
  } else {
    attribute.action = 'set'
    attribute.value = attribute_value
  }
  return attribute
}

function _build_tags_object(payload: TagsPayload): object {
  /*
  This function takes a Group event and builds a Tag payload. It assumes values are booleans
  and adds tags for `true` values, removes them for `false` values. It ignores all other types.
  */
  const tags_to_add: string[] = []
  const tags_to_remove: string[] = []
  const tag_group = payload.tag_group
  const properties = payload.tags || {}
  for (const [k, v] of Object.entries(properties)) {
    if (typeof v == 'boolean') {
      if (v) {
        tags_to_add.push(k)
      } else {
        tags_to_remove.push(k)
      }
    }
  }
  const airship_payload: { audience: {}; add?: {}; remove?: {} } = { audience: {} }
  airship_payload.audience = {
    named_user_id: payload.named_user_id
  }
  if (tags_to_add.length > 0) {
    airship_payload.add = { [tag_group]: tags_to_add }
  }

  if (tags_to_remove.length > 0) {
    airship_payload.remove = { [tag_group]: tags_to_remove }
  }
  return airship_payload
}

function validate_timestamp(timestamp: string | number | Date) {
  const payload_time_stamp: Date = new Date(timestamp)
  const three_months_ago: Date = new Date()
  three_months_ago.setDate(three_months_ago.getDate() - 90)
  if (three_months_ago > payload_time_stamp) {
    return false
  } else {
    return payload_time_stamp.toISOString().split('.')[0]
  }
}

function parse_date(attribute_value: any): Date | null {
  // Attempt to parse the attribute_value as a Date
  const date = new Date(attribute_value)

  // Check if the parsing was successful and the result is a valid date
  if (!isNaN(date.getTime())) {
    return date // Return the parsed Date
  }

  return null // Return null for invalid dates
}

export const _private = {
  _build_custom_event_object,
  _build_attributes_object,
  _build_attribute,
  _build_tags_object,
  parse_date,
  validate_timestamp
}
