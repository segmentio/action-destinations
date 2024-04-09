import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import saveEvent from './saveEvent'
import saveOrder from './saveOrder'
import saveUser from './saveUser'

// const standardEvents = {
//   page_viewed: ['Page Viewed']
// }

export const presets: DestinationDefinition['presets'] = [
  {
    name: 'Save User',
    subscribe: 'type = "identify"',
    partnerAction: 'saveUser',
    mapping: defaultValues(saveUser.fields),
    type: 'automatic'
  },
  {
    name: 'Save Order',
    subscribe: 'event = "Purchase" or event = "Order Completed"',
    partnerAction: 'saveOrder',
    mapping: defaultValues(saveOrder.fields),
    type: 'automatic'
  },
  {
    name: 'Save Order',
    subscribe: 'event = "Purchase" or event = "Order Completed"',
    partnerAction: 'saveOrder',
    mapping: defaultValues(saveOrder.fields),
    type: 'automatic'
  },
  {
    name: 'Save Page',
    subscribe: 'type = "page"',
    partnerAction: 'saveEvent',
    mapping: {
      ...defaultValues(saveEvent.fields),
      event_name: 'page_viewed'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Page Viewed',
    subscribe: 'type = "page"',
    partnerAction: 'saveEvent',
    mapping: {
      ...defaultValues(saveEvent.fields),
      event_name: 'page_viewed'
    },
    type: 'automatic'
  },
  {
    name: 'Save Event - Checkout Completed',
    subscribe: 'event = "Purchase" or event = "Order Completed"',
    partnerAction: 'saveOrder',
    mapping: {
      ...defaultValues(saveEvent.fields),
      event_name: 'checkout_completed'
    },
    type: 'automatic'
  }
]
