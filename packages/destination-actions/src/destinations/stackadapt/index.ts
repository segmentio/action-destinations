import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { defaultValues } from '@segment/actions-core'
import forwardEvent from './forwardEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'StackAdapt (Actions)',
  slug: 'actions-stackadapt-cloud',
  mode: 'cloud',
  description:
    'Forward Segment events to StackAdapt for tracking ad conversions, and generating lookalike and retargeting Audiences',
  authentication: {
    scheme: 'custom',
    fields: {
      pixelId: {
        label: 'Universal Pixel ID',
        description: 'Your StackAdapt Universal Pixel ID',
        type: 'string',
        required: true
      }
    }
  },
  presets: [
    {
      name: 'Forward Event',
      subscribe: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
      partnerAction: 'forwardEvent',
      mapping: defaultValues(forwardEvent.fields),
      type: 'automatic'
    }
  ],
  actions: {
    forwardEvent
  }
}

export default destination
