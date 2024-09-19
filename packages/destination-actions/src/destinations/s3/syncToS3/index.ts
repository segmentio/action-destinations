import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { send } from '../functions'
import { Data, RawMapping } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to S3',
  description: 'Syncs Segment event data to S3.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: commonFields,
  perform: async (_, data) => {
    const { payload, settings } = data
    const rawMapping: RawMapping = (data as unknown as Data).rawMapping
    return send([payload], settings, rawMapping)
  },
  performBatch: async (_, data) => {
    const { payload, settings } = data
    const rawMapping: RawMapping = (data as unknown as Data).rawMapping
    return send(payload, settings, rawMapping)
  }
}

export default action
