import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields, products } from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ecommerce Event (multi product)',
  description:
    '(Beta) Send a multi product [Ecommerce Recommended event](https://www.braze.com/docs/user_guide/data/activation/custom_data/recommended_events/ecommerce_events) to Braze.',
  fields: {
    ...commonFields,
    products
  },
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to track events',
    default: 'add',
    choices: [
      { label: 'Add Profile with Event', value: 'add' },
      { label: 'Update Profile with Event', value: 'update' }
    ]
  },
  perform: async (request, { payload, settings, syncMode }) => {
    return await send(request, [payload], settings, false, syncMode)
  },
  performBatch: async (request, { payload, settings, syncMode }) => {
    return await send(request, payload, settings, true, syncMode)
  }
}

export default action
