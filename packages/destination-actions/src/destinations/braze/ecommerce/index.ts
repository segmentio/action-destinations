import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { 
  commonFields,
  products,
} from './fields'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ecommerce Event (multi product)',
  description: 'Send a multi product ecommerce event to Braze',
  fields: {
    ...commonFields,
    products
  },
  perform: async (request, {payload, settings}) => {
    return await send(request, [payload], settings, false)
  },
  performBatch: async (request, {payload, settings}) => {
    return await send(request, payload, settings, true)
  }
}

export default action
