import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postConversion from './postConversion'

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Google Enhanced Conversions',
  authentication: {
    scheme: 'custom',
    fields: {
      conversionTrackingId: {
        label: 'Conversion Tracking ID',
        description: 'Tracking id that uniquely identifies your advertiser account.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: () => {
      // TODO: Return a request that tests/validates the user's authentication fields here
      return true
    }
  },
  extendRequest({ settings }) {
    return {
      searchParams: {
        conversion_tracking_id: settings.conversionTrackingId
      }
    }
  },
  actions: {
    postConversion
  }
}

export default destination
