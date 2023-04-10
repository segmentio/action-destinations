import { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { Payload as CustomEventsPayload } from './customEvents/generated-types'
import { Payload as AttributesPayload } from './setAttributes/generated-types'
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
  for (const [key, value] of Object.entries(payload.traits)) {
    attributes.push({
      action: 'set',
      key: `${key}`,
      value: `${value}`,
      timestamp: validate_timestamp(payload.occurred)
    })
  }
  const airship_payload = {
    attributes: attributes,
    audience: {
      named_user_id: `${payload.user}`
    }
  }
  console.log(JSON.stringify(airship_payload))
  console.log(uri)
  // uri = 'https://webhook.site/ffa14153-f2af-44f8-a115-65628dbe6797'

  return request(uri, {
    method: 'POST',
    json: airship_payload
  })
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
