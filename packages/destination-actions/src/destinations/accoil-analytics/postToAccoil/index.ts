import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post to Accoil',
  description: 'Send Data to Accoil Analytics',
  defaultSubscription: 'type = "track"',

  fields: {
    segmentEventData: {
      label: 'Event Payload',
      description: 'Segment Event Payload',
      type: 'object',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const staging = settings?.api_key?.toLowerCase()?.startsWith('stg_')
    return request(staging == true ? `https://instaging.accoil.com/segment` : `https://in.accoil.com/segment`, {
      method: 'post',
      json: payload.segmentEventData
    })
  }
}

export default action
