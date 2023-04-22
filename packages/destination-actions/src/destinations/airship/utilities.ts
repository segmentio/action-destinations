import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Payload as CustomEventsPayload } from './customEvents/generated-types'
import { Payload as AttributesPayload } from './setAttributes/generated-types'
import { Payload as TagsPayload } from './manageTags/generated-types'

export function sendCustomEvent(request: RequestClient, settings: Settings, payload: CustomEventsPayload) {
  if (payload.properties) {
    payload.properties.source = 'segment'
  } else {
    payload.properties = {
      source: 'Segment'
    }
  }
  // validate/repair payload types
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
  return request(`${settings.endpoint}/api/custom-events`, {
    method: 'POST',
    json: [airship_payload]
  })
}

export function setAttribute(request: RequestClient, settings: Settings, payload: AttributesPayload) {
  const uri = `${settings.endpoint}/api/channels/attributes`
  const attributes = []
  /*
    Iterate over traits
    * Traits that contain nested objects are flattened using underscores then added to attributes
    * replace spaces in keys with _
    * for number attributes, remove any non-numeric characters and parse string to int
    * format attribute as date for date type attributes
  */
  for (const [key, value] of Object.entries(payload.traits)) {
    if (key == 'address') {
      if (typeof value == 'object') {
        for (const [k, v] of Object.entries(value)) {
          const new_attribute_key: string = trait_to_attribute_map(k)
          attributes.push(add_attribute(new_attribute_key, v, payload.occurred))
        }
        continue
      }
    }
    if (key == 'company') {
      if (typeof value == 'object') {
        if (value.name) {
          attributes.push(add_attribute(key, value.name, payload.occurred))
        }
      }
      continue
    }
    attributes.push(add_attribute(key, value, payload.occurred))
  }
  const airship_payload = {
    attributes: attributes,
    audience: {
      named_user_id: `${payload.user}`
    }
  }
  console.log(uri)

  return request(uri, {
    method: 'POST',
    json: airship_payload
  })
}

export function manageTags(request: RequestClient, settings: Settings, payload: TagsPayload) {
  const tags_to_add: string[] = []
  const tags_to_remove: string[] = []
  for (const [k, v] of Object.entries(payload.properties)) {
    if (typeof v == 'boolean') {
      if (v) {
        tags_to_add.push(k)
      } else {
        tags_to_remove.push(k)
      }
    }
  }
  const airship_payload = { audience: {}, add: {}, remove: {} }
  airship_payload.audience = {
    named_user_id: payload.named_user_id
  }
  if (tags_to_add.length > 0) {
    airship_payload.add = { 'segment-integration': tags_to_add }
  } else {
    delete airship_payload.add
  }

  if (tags_to_remove.length > 0) {
    airship_payload.remove = { 'segment-integration': tags_to_remove }
  } else {
    delete airship_payload.remove
  }
  console.log(JSON.stringify(airship_payload))
  return request(`${settings.endpoint}/api/named_users/tags`, {
    method: 'POST',
    json: airship_payload
  })
}

function add_attribute(attribute_key: string, attribute_value: any, occurred: string | number) {
  return {
    action: 'set',
    key: `${attribute_key}`,
    value: `${attribute_value}`,
    timestamp: validate_timestamp(occurred)
  }
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
    console.log("yup it's true")
    return payload_time_stamp.toISOString().split('.')[0]
  }
}
// function let(tags_to_add: any,tags_to_remove: any) {
//   throw new Error('Function not implemented.')
// }
