import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackConversion from './trackConversion'

// Preset mappings reuse the action's default field values, but pin `a` to a
// preset-specific enum value (the `a` field itself intentionally has no default).
const baseMapping = defaultValues(trackConversion.fields)

const destination: DestinationDefinition<Settings> = {
  name: 'Vibe Tracking Event',
  slug: 'actions-vibe-conversions',
  mode: 'cloud',
  description: 'Send conversion events to Vibe.',

  authentication: {
    // Vibe's conversion API requires no API key or token. The advertiser is
    // identified by the Pixel ID (aid), which is injected into every event.
    scheme: 'custom',
    fields: {
      aid: {
        type: 'string',
        label: 'Pixel ID',
        description: 'The Vibe pixel ID associated with the advertiser. Found in the Vibe dashboard.',
        required: true
      }
    },
    testAuthentication: (_request, { settings }) => {
      if (!settings.aid) {
        throw new Error('Pixel ID is required.')
      }
      return true
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
