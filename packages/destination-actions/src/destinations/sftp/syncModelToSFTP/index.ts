import type { ActionDefinition } from '@segment/actions-core'
import { baseFields } from '../fields'
import { send } from '../functions'
import type { Settings } from '../generated-types'
import { Data, RawMapping } from '../types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync RETL Model to SFTP',
  description: 'Syncs RETL Model to SFTP',
  defaultSubscription: 'type = "track"',
  fields: baseFields,
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
