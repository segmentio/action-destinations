import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { purchaseFields } from '../fields'
import { send } from '../functions'
import { EventType } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send event when a user completes a purchase',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: purchaseFields,
  perform: (request, { payload, settings, features, statsContext }) => {
    return send(request, payload, settings, EventType.Purchase, features, statsContext)
  }
}

export default action
