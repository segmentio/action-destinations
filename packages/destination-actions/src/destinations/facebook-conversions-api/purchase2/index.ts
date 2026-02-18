import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { purchaseFields } from '../fields'
import { send } from '../functions'
import { EventType } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase V2',
  description: 'Send event when a user completes a purchase',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: purchaseFields,
  perform: (request, { payload, settings, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      return send(request, payload, settings, EventType.Purchase, features, statsContext)
    } else {
      throw new IntegrationError(`Sync mode ${syncMode} is not supported`, 'Misconfigured sync mode', 400)
    }
  }
}

export default action
