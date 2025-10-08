import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'
import { target, eventType, eventData, products } from './fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Event',
  description: 'Sync ecommerce events to Taguchi.',
  fields: {
    target,
    eventType,
    eventData,
    products
  },
  perform: async (request, { payload, settings }) => {
    await send(request, [payload], settings, false)
  },
  performBatch: async (request, { payload, settings }) => {
    await send(request, payload, settings, true)
  }
}

export default action
