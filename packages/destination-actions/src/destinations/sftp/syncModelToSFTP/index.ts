import type { ActionDefinition } from '@segment/actions-core'
import { baseFields } from '../fields'
import { send } from '../functions'
import type { Settings } from '../generated-types'
import { Data, RawMapping } from '../types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync RETL Model',
  description:
    'Sync Reverse ETL model data to SFTP. Can also be used to sync Segment events with no predefined mappings.',
  defaultSubscription: 'type = "identify" or type = "track" or type = "page" or type = "screen" or type = "group"',
  fields: baseFields,
  perform: async (_, data) => {
    const { payload, settings, signal } = data
    const rawMapping: RawMapping = (data as unknown as Data).rawMapping
    return send([payload], settings, rawMapping, signal)
  },
  performBatch: async (_, data) => {
    const { payload, settings, signal } = data
    const rawMapping: RawMapping = (data as unknown as Data).rawMapping
    return send(payload, settings, rawMapping, signal)
  }
}

export default action
