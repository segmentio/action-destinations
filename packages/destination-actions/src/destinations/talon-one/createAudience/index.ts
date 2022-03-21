import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Audience',
  description: 'This creates a new audience entity in Talon.One.',
  fields: {
    audienceId: {
      label: 'Segment Audience ID',
      description: 'You should get this audience ID from Segment.',
      type: 'string',
      required: true
    },
    audienceName: {
      label: 'Audience Name',
      description: 'You should get this audience name from Segment.',
      type: 'string',
      required: true
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/audiences`, {
      method: 'post',
      json: {
        audienceId: payload.audienceId,
        audienceName: payload.audienceName
      }
    })
  }
}

export default action
