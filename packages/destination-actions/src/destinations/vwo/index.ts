import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'VWO Cloud Mode (Actions)',
  slug: 'actions-vwo-cloud',
  mode: 'cloud',
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    }
  ],
  authentication: {
    scheme: 'custom',
    fields: {
      vwoAccountId: {
        label: 'VWO Account ID',
        description: 'Enter your VWO Account ID',
        type: 'number',
        required: true
      }
    }
  },

  actions: {
    trackEvent
  }
}

export default destination
