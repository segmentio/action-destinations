import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { 
  commonFields,
  product,
} from '../ecommerce/fields'
import { send } from '../ecommerce/functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ecommerce Event (single product)',
  description: 'Send a single product ecommerce event to Braze',
  fields: {
    ...commonFields,
    product
  },
  perform: async (request, {payload, settings}) => {
    return await send(request, [payload], settings, false)
  },
  performBatch: async (request, {payload, settings}) => {
    return await send(request, payload, settings, true)
  }
}

export default action
