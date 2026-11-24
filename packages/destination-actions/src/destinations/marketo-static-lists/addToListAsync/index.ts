import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { addToList, addToListBatch } from '../functions'
import { retlOnMappingSaveHook } from '../retlOnMappingSaveHook'
import { title, description, defaultSubscription, fields } from './fields'

/**
 * Sync twin of the async action (same pattern as Salesforce Marketing Cloud's asyncDataExtension).
 * The type generator and action registry read `actions`, so the async action needs an entry here.
 * If invoked outside the async pipeline it behaves exactly like the existing Add to List action.
 */
const action: ActionDefinition<Settings, Payload> = {
  title,
  description,
  defaultSubscription,
  fields,
  hooks: {
    retlOnMappingSave: retlOnMappingSaveHook<Payload>()
  },
  perform: async (request, { settings, payload, statsContext, hookOutputs }) => {
    return addToList(request, settings, payload, statsContext, hookOutputs?.retlOnMappingSave?.outputs)
  },
  performBatch: async (request, { settings, payload, statsContext, hookOutputs }) => {
    return addToListBatch(request, settings, payload, statsContext, hookOutputs?.retlOnMappingSave?.outputs)
  }
}

export default action
