import type { AsyncActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { retlOnMappingSaveHook } from '../retlOnMappingSaveHook'
import { pollBulkImport, submitBulkImport } from './functions'
import { title, description, defaultSubscription, fields } from './fields'

/**
 * Adds leads to a Marketo static list using the Bulk Lead Import API and reports the real job
 * outcome by polling it. Add-only: Bulk Import cannot remove leads, so removals stay on the
 * REST-based Sync List / Remove from List actions.
 */
const action: AsyncActionDefinition<Settings, Payload> = {
  title,
  description,
  defaultSubscription,
  fields,
  hooks: {
    retlOnMappingSave: retlOnMappingSaveHook<Payload>()
  },
  performBatch: async (request, { settings, payload, statsContext, hookOutputs }) => {
    return submitBulkImport(request, settings, payload, statsContext, hookOutputs?.retlOnMappingSave?.outputs)
  },
  performPoll: async (request, { settings, payload, logger }) => {
    return pollBulkImport(request, settings, payload, logger)
  }
}

export default action
