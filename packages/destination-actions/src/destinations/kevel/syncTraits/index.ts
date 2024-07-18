import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Traits',
  description:
    "Sync user profile traits and Audiences from Segment to Kevel UserDB as `customProperties`. See Kevel's [documentation for more details](https://dev.kevel.com/reference/set-custom-properties-alternative).",
  defaultSubscription: 'type = "identify"',
  fields: {
    segment_user_id: {
      label: 'User ID',
      description: "The user's unique ID",
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    traits: {
      label: 'Traits',
      description: "The user's profile traits / attributes",
      type: 'object',
      required: true,
      default: { '@path': '$.traits' }
    }
  },
  perform: async (request, data) => {
    const settings = data.settings

    const baseUrl = `https://e-${settings.networkId}.adzerk.net/udb/${settings.networkId}`

    const payload = data.payload

    const existingResponse = await request(`${baseUrl}/read?userKey=${payload.segment_user_id}`, {
      method: 'GET'
    })

    const existingRecord = await existingResponse.json()

    const mergedTraits = { ...existingRecord?.custom, ...payload.traits }

    return request(`${baseUrl}/customProperties?userKey=${payload.segment_user_id}`, {
      json: mergedTraits,
      method: 'POST'
    })
  }
}

export default action
