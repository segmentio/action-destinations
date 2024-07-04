import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEvent from './sendEvent'
import kitchenSink from './kitchenSink'

const destination: DestinationDefinition<Settings> = {
  name: 'Mappings Two Test',
  slug: 'actions-mappings-two-test',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'Your Mappings Two Test API Key. This is a Segment production write key that you can find in your Segment settings. All the actions in this destination will send payloads as Segment events to this source.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://cdn.segment.com/v1/projects/${settings.apiKey}/settings`)
    }
  },

  actions: {
    sendEvent,
    kitchenSink
  }
}

export default destination
