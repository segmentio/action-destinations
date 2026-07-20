import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackConversion from './trackConversion'

const baseMapping = defaultValues(trackConversion.fields)

const destination: DestinationDefinition<Settings> = {
  name: 'Vibe Tracking Event',
  slug: 'actions-vibe-conversions',
  mode: 'cloud',
  description: 'Send conversion events to Vibe.',

  authentication: {
    scheme: 'custom',
    fields: {
      aid: {
        type: 'string',
        label: 'Pixel ID',
        description: 'The Vibe pixel ID associated with the advertiser. Found in the Vibe dashboard.',
        required: true
      }
    }
  },

  actions: {
    trackConversion
  },

  presets: [
    {
      name: 'Order Completed',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'trackConversion',
      mapping: { ...baseMapping, a: 'purchase' },
      type: 'automatic'
    },
    {
      name: 'Page Viewed',
      subscribe: 'type = "page"',
      partnerAction: 'trackConversion',
      mapping: { ...baseMapping, a: 'page_view' },
      type: 'automatic'
    },
    {
      name: 'Signed Up',
      subscribe: 'event = "Signed Up"',
      partnerAction: 'trackConversion',
      mapping: { ...baseMapping, a: 'signup' },
      type: 'automatic'
    }
  ]
}

export default destination
