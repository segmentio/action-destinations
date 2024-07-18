import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { buildPerformer } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Code',
  description: 'Track when a user enters a discount code at checkout.',
  defaultSubscription: 'type = "track" and event = "Coupon Entered"',
  fields: {
    code: {
      label: 'Code',
      description: 'The coupon or discount code applied',
      type: 'string',
      default: { '@path': '$.properties.coupon_id' },
      required: true
    },
    type: {
      label: 'Type',
      description: 'The type of coupon or discount code used',
      type: 'string',
      default: 'promo',
      required: true
    }
  },
  perform: buildPerformer('code')
}

export default action
