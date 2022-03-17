import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Audience',
  description: 'This deletes the audience entity in Talon.One.',
  fields: {
    audienceId: {
      label: 'Segment Audience ID',
      description: 'You should get this audience ID from Segment.',
      type: 'string',
      required: true
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/audiences/${payload.audienceId}`, { method: 'delete' })
  }
}

export default action
