import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Upsert contact to Cordial',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id: {
      label: 'Segment ID',
      description: 'Segment User ID',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Segment Anonymous ID',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      label: 'Segment traits',
      description: 'Segment contact attributes',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
  },
  perform: (request, { settings, payload }) => {
    const identifyEndpoint = `${settings.endpoint}/identify`
    return request(identifyEndpoint, {
      method: 'post',
      json: payload
    })
  }
}

export default action
