import type { DestinationDefinition } from '@segment/actions-core'
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

  actions: {
    trackConversionEvent
  }
}

export default destination
