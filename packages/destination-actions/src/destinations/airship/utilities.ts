import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Payload as CustomEventsPayload } from './customEvents/generated-types'
import { Payload as AttributesPayload } from './setAttributes/generated-types'
import { Payload as TagsPayload } from './manageTags/generated-types'

export function setCustomEvent(request: RequestClient, settings: Settings, payload: CustomEventsPayload) {
  const uri = `${settings.endpoint}/api/custom-events`
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
  return do_request(request, uri, [airship_payload])
}

export function setAttribute(request: RequestClient, settings: Settings, payload: AttributesPayload) {
  const uri = `${settings.endpoint}/api/channels/attributes`
  const attributes = []
  const traits = payload.traits || {}
  for (const key in traits) {
    if (key == 'address') {
      if (typeof traits[key] == 'object') {
        const current_object: any = traits[key]
        for (const k in current_object) {
          const new_attribute_key: string = trait_to_attribute_map(k)
          attributes.push(build_attribute(new_attribute_key, current_object[k], payload.occurred))
        }
        continue
      }
    }
    if (key == 'company') {
      if (typeof traits[key] == 'object') {
        const current_object: any = traits[key]
        if (current_object.name) {
          attributes.push(build_attribute(key, current_object.name, payload.occurred))
        }
      }
      continue
    }

    // if trait value is empty string, remove attribute, otherwise set it
    attributes.push(build_attribute(key, traits[key], payload.occurred))
  }
  const airship_payload = {
    attributes: attributes,
    audience: {
      named_user_id: `${payload.user}`
    }
  }
  return do_request(request, uri, airship_payload)
}

export function manageTags(request: RequestClient, settings: Settings, payload: TagsPayload) {
  const uri = `${settings.endpoint}/api/named_users/tags`
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

  return do_request(request, uri, airship_payload)
}

function do_request(request: RequestClient, uri: string, payload: object) {
  return request(uri, {
    method: 'POST',
    json: payload
  })
}

function build_attribute(attribute_key: string, attribute_value: any, occurred: string | number) {
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
