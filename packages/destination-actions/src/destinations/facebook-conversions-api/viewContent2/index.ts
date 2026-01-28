import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { viewContentFields } from '../fields'
import { send } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'View Content V2',
  description: 'Send event when a user views content or a product',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'add',
    choices: [{ label: 'Insert Records', value: 'add' }]
  },
  fields: viewContentFields,
  perform: (request, { payload, settings, features, statsContext, syncMode }) => {
    if (syncMode === 'add') {
      return send(request, payload, settings, features, statsContext)
    } 
    else {
      throw new IntegrationError(`Sync mode ${syncMode} is not supported`, 'Misconfigured sync mode', 400)
    }
  }
}

export default action
