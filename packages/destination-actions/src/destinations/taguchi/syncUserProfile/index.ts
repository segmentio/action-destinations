import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { identifiers, traits, timestamp, subscribeLists, unsubscribeLists } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync User Profile',
  description: 'Sync user profile details to Taguchi, and add / remove users from Taguchi Lists.',
  fields: {
    identifiers,
    traits,
    timestamp,
    subscribeLists,
    unsubscribeLists
  },
  perform: async (request, { payload, settings }) => {
    await send(request, [payload], settings, false)
  },
  performBatch: async (request, { payload, settings }) => {
    await send(request, payload, settings, true)
  }
}

export default action
