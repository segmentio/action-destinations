import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Delete Audience',
  description: 'This deletes the audience entity in Talon.One.',
  fields: {
    audience_id: {
      label: 'audience_id',
      description: 'You should get this audience ID from Segment.',
      type: 'string',
      required: true
    }
  },
  perform: (request, { payload }) => {
    // Make your partner api request here!
    return request(`https://integration.talon.one/segment/audiences/${payload.audience_id}`, { method: 'delete' })
  }
}

export default action
