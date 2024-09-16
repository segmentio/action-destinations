import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { send } from '../functions'
import { SingleData, BatchData, RawMapping } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync to S3',
  description: 'Syncs Segment event data to S3.',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: commonFields,
  perform: async (_, data) => {
    const { payload, settings } = data
    const rawMapping: RawMapping = (data as unknown as SingleData).rawMapping
    return send([payload], settings, rawMapping)
  },
  performBatch: (_, data) => {
    const { payload, settings } = data
    const rawMapping: RawMapping[] = (data as unknown as BatchData).rawMapping
    return send(payload, settings, rawMapping[0])
  }
}

export default action
