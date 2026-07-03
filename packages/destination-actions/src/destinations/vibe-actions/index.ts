import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackConversionEvent from './trackConversionEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Vibe (Actions)',
  slug: 'actions-vibe',
  mode: 'cloud',
  description: 'Send server-to-server conversion events to Vibe.',
  authentication: {
    // The Vibe S2S conversion endpoint requires no credentials. The advertiser
    // is identified solely by the pixelId (sent as `aid` in the request body).
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Pixel ID',
        description:
          'The Vibe pixel identifier (aid) from your advertiser dashboard. Identifies your advertiser account for server-to-server conversion tracking.',
        type: 'string',
        required: true
      }
    }
    // No testAuthentication: there is no credential to validate. The pixelId is
    // enforced as a required setting.
  },

  presets: [
    {
      name: 'Order Completed',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'trackConversionEvent',
      mapping: {
        ...defaultValues(trackConversionEvent.fields),
        action: 'purchase'
      },
      type: 'automatic'
    },
    {
      name: 'Page Viewed',
      subscribe: 'type = "page"',
      partnerAction: 'trackConversionEvent',
      mapping: {
        ...defaultValues(trackConversionEvent.fields),
        action: 'page_view'
      },
      type: 'automatic'
    },
    {
      name: 'Signed Up',
      subscribe: 'type = "track" and event = "Signed Up"',
      partnerAction: 'trackConversionEvent',
      mapping: {
        ...defaultValues(trackConversionEvent.fields),
        action: 'signup'
      },
      type: 'automatic'
    }
  ],

  actions: {
    trackConversionEvent
  }
}

export default destination
