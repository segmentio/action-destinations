import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { fields } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience to Sendgrid List',
  description: 'Sync a Segment Engage Audience to a Sendgrid List',
  fields,
  perform: async (request, { payload }) => {
    return await send(request, payload)
  }
}

export default action
