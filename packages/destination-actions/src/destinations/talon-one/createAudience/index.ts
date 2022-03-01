import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Audience',
  description: 'Create Audience in Talon.One',
  fields: {
    audience_id: {
      label: 'audience_id',
      description: 'Segment Audience ID (Third party audience id)',
      type: 'string',
      required: true
    },
    audience_name: {
      label: 'audience_name',
      description: 'Segment Audience Name (Third party audience name)',
      type: 'string',
      required: true
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/audiences`, {
      method: 'post',
      json: {
        audience_id: payload.audience_id,
        audience_name: payload.audience_name
      }
    })
  }
}

export default action
