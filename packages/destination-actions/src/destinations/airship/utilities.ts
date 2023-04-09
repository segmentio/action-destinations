import { RequestClient } from '@segment/actions-core'
import type {Settings} from './generated-types' 
import type {Payload} from './customEvents/generated-types'
// import { Dictionary } from 'lodash'

export function sendCustomEvent(request: RequestClient, settings: Settings, payload: Payload) {
   if (payload.properties) {
      payload.properties.source = 'segment'
    } else {
      payload.properties = {
        source: 'segment'
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
    json: [
          airship_payload
        ]
  })
}

function validate_timestamp(timestamp: string | number | Date ) {
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
