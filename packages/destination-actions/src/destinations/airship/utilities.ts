import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Payload as CustomEventsPayload } from './customEvents/generated-types'
import { Payload as AttributesPayload } from './setAttributes/generated-types'
// import { Dictionary } from 'lodash'
// import { Dictionary } from 'lodash'

export function sendCustomEvent(request: RequestClient, settings: Settings, payload: CustomEventsPayload) {
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
      named_user_id: payload.user
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
    * if trait key is address, assign all properties to pre-established airship attributes
    * Traits that contain nested objects are flattened using underscores then added to attributes
    * replace spaces in keys with _
    * for number attributes, remove any non-numeric characters and parse string to int
    * format attribute as date for date type attributes
  */
  for (const [key, value] of Object.entries(payload.traits)) {
    if (key == 'address') {
      if (is_type_dict(value)) {
        for (const [k, v] of Object.entries(value)) {
          const new_attribute_key: string = trait_to_attribute_map(k)
          attributes.push(add_attribute(new_attribute_key, v, payload.occurred))
        }
      }
    }
    attributes.push(add_attribute(key, value, payload.occurred))
  }
  const airship_payload = {
    attributes: attributes,
    audience: {
      named_user_id: `${payload.user}`
    }
  }
  console.log(JSON.stringify(airship_payload, null, 2))
  console.log(uri)
  // uri = 'https://webhook.site/ffa14153-f2af-44f8-a115-65628dbe6797'

  return request(uri, {
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

function is_type_dict(trait: any) {
  if (trait.constructor != 'Object') {
    return false
  } else {
    return true
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
