import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { addToList, addToListBatch } from '../functions'

// Standard (synchronous) variant of the async Add to List action. It shares the exact same fields
// as the async variant (index.async.ts) and is registered under `actions` so its schema is emitted
// into metadata.json / the control plane. This is the fallback pipeline that runs until the async
// (performBatch + performPoll) pipeline is enabled -- mirrors the SFMC asyncDataExtension pattern.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to List (Async)',
  description:
    'Add users to a list in Marketo asynchronously using the Bulk Lead Import API. Submits an import job and polls its status.',
  defaultSubscription: 'event = "Audience Entered"',
  fields,
  perform: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('addToAudience', 1, statsContext?.tags)
    return addToList(request, settings, payload, statsContext)
  },
  performBatch: async (request, { settings, payload, statsContext }) => {
    statsContext?.statsClient?.incr('addToAudience.batch', 1, statsContext?.tags)
    return addToListBatch(request, settings, payload, statsContext)
  }
}

export default action
