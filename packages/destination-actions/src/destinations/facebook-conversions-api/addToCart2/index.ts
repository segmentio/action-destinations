import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../functions'
import { addToCartFields } from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Cart V2',
  description: 'Send event when a user adds a product to the shopping cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: addToCartFields,
  perform: (request, { payload, settings, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      return send(request, payload, settings, features, statsContext)  
    } 
    else {
      throw new IntegrationError(`Sync mode ${syncMode} is not supported`, 'Misconfigured required field', 400)
    }
  }
}

export default action
