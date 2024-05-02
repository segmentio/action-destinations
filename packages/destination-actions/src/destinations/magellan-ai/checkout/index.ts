import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'
import { orderInfoFields, priceFields } from '../schema'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Checkout',
  description: 'This event tracks when a user goes to check out, regardless of whether they complete the purchase.',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
  fields: {
    ...priceFields(),
    ...orderInfoFields
  },
  perform: buildPerformer('checkout')
}

export default action
