import type { Settings } from './generated-types'
import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'
import { browserDestination } from '@segment/browser-destination-runtime/shim'
import { CJ } from './types'
import sitePage from './sitePage'
import order from './order'
import { defaultValues } from '@segment/actions-core'

declare global {
  interface Window {
    cj: CJ
  }
}

export const destination: BrowserDestinationDefinition<Settings, CJ> = {
  name: 'Commission Junction',
  slug: 'actions-cj',
  mode: 'device',
  description: 'The Commission Junction Browser Destination allows you to install the CJ Javascript pixel onto your site and pass mapped Segment events and metadata to CJ.',
  settings: {
    tagId: {
      label: 'Tag ID',
      description: 'Your Commission Junction Tag ID.',
      type: 'string',
      required: true
    },
    actionTrackerId: {
      label: 'Action Tracker ID',
      description: 'Used with the "Order" Action only. Can be overridden at the Action level. This is a static value provided by CJ. Each account may have multiple actions and each will be referenced by a different actionTrackerId value.',
      type: 'string'
    }
  },
  initialize: async () => {
    if (!window.cj) {
      window.cj = {} as CJ
    }
    return window.cj
  },
  actions: {
    sitePage,
    order
  },
  presets: [
    {
      name: 'Send Order',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'order',
      mapping: defaultValues(order.fields),
      type: 'automatic'
    },
  ]
}


export default browserDestination(destination)
