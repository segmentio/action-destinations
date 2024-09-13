import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../functions'
import { commonFields, audienceOnlyFields } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to S3',
  description: 'Syncs Segment event data to S3.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    ...commonFields,
    ...audienceOnlyFields
  },
  perform: async (_, { payload, settings }) => {
    return send([payload], settings)
  },
  performBatch: (_, { payload, settings }) => {
    return send(payload, settings)
  }
}

export default action
