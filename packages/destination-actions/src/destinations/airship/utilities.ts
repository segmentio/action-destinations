import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Payload as CustomEventsPayload } from './customEvents/generated-types'
import { Payload as AttributesPayload } from './setAttributes/generated-types'
import { Payload as TagsPayload } from './manageTags/generated-types'

// exported Action function
export function setCustomEvent(request: RequestClient, settings: Settings, payload: CustomEventsPayload) {
  const uri = `${settings.endpoint}/api/custom-events`
  const airship_payload = _build_custom_event_object(payload)
  return do_request(request, uri, [airship_payload])
}

// exported Action function
export function setBatchCustomEvent(request: RequestClient, settings: Settings, payloads: CustomEventsPayload[]) {
  const uri = `${settings.endpoint}/api/custom-events`
  const airship_payload = []
  for (let i = 0; i <= payloads.length; i++) {
    airship_payload.push(_build_custom_event_object(payloads[i]))
  }
  return do_request(request, uri, airship_payload)
}

// exported Action function
export function setAttribute(request: RequestClient, settings: Settings, payload: AttributesPayload) {
  const uri = `${settings.endpoint}/api/channels/attributes`
  const attributes = _build_attributes_object(payload)
  const airship_payload = {
    attributes: attributes,
    audience: {
      named_user_id: `${payload.user}`
    }
  }
  return do_request(request, uri, airship_payload)
}

// exported Action function
export function manageTags(request: RequestClient, settings: Settings, payload: TagsPayload) {
  const uri = `${settings.endpoint}/api/named_users/tags`
  const airship_payload = _build_tags_object(payload)
  return do_request(request, uri, airship_payload)
}

function do_request(request: RequestClient, uri: string, payload: object) {
  return request(uri, {
    method: 'POST',
    json: payload
  })
}

function _build_custom_event_object(payload: CustomEventsPayload): object {
  /*
  This function takes a Track payload and builds a Custom Event payload.
  It adds the `source: 'Segment'` property and validates the occurred timestamp but doesn't
  do much else in terms of validation. Traits line up pretty well with Custom Event properties.
  */
  if (payload.properties) {
    payload.properties.source = 'segment'
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
  This function takes an Identify event and builds an Attributes payload. It converts 
  `address` or `company` objects into known attributes, otherwise just passes it through.
  Also, if the valuse of a trait is an empty string, we assume the intention is to remove the
  attribute from the given user.
  */
  const attributes = []
  const traits = payload.traits || {}
  for (const key in traits) {
    if (key == 'address') {
      if (typeof traits[key] == 'object') {
        const current_object: any = traits[key]
        for (const k in current_object) {
          const new_attribute_key: string = trait_to_attribute_map(k)
          attributes.push(_build_attribute(new_attribute_key, current_object[k], payload.occurred))
        }
        continue
      }
    }
    if (key == 'company') {
      if (typeof traits[key] == 'object') {
        const current_object: any = traits[key]
        if (current_object.name) {
          attributes.push(_build_attribute(key, current_object.name, payload.occurred))
        }
      }
      continue
    }

    // if trait value is empty string, remove attribute, otherwise set it
    attributes.push(_build_attribute(key, traits[key], payload.occurred))
  }
  return attributes
}

function _build_attribute(attribute_key: string, attribute_value: any, occurred: string | number) {
  /*
  This function builds a single attribute from a key/value.
  */
  const attribute: { action: string; key: string; value?: string | number | boolean; timestamp: string | boolean } = {
    action: 'set',
    key: attribute_key,
    timestamp: validate_timestamp(occurred)
  }
  if (typeof attribute_value == 'string' && attribute_value.length === 0) {
    attribute.action = 'remove'
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
  const properties = payload.properties || {}
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
    airship_payload.add = { 'segment-integration': tags_to_add }
  }

  if (tags_to_remove.length > 0) {
    airship_payload.remove = { 'segment-integration': tags_to_remove }
  }
  return airship_payload
}

function trait_to_attribute_map(attribute_key: string): string {
  const TRAIT_TO_ATTRIBUTE_ID_MAP = new Map<string, string>([
    ['age', 'age'],
    ['birthday', 'birthdate'],
    ['city', 'city'],
    ['country', 'country'],
    ['createdAt', 'account_creation'],
    ['email', 'email'],
    ['firstName', 'first_name'],
    ['gender', 'gender'],
    ['lastName', 'last_name'],
    ['name', 'full_name'],
    ['phone', 'mobile_phone'],
    ['postalCode', 'zipcode'],
    ['state', 'region'],
    ['title', 'title'],
    ['username', 'username']
  ])
  return TRAIT_TO_ATTRIBUTE_ID_MAP.get(attribute_key) as string
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
