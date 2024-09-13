import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync events to S3',
  description: 'Syncs Segment event data to S3.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: commonFields,
  perform: async (_, { payload, settings }) => {
    return send([payload], settings)
  },
  performBatch: (_, { payload, settings }) => {
    return send(payload, settings)
  }
}

export default action
