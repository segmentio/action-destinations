import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import identify from './identify'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Identify User',
    subscribe: 'type = "identify"',
    partnerAction: 'identify',
    mapping: defaultValues(identify.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'UserMotion (Actions)',
  slug: 'actions-usermotion',
  mode: 'cloud',
  description: 'Send server-side events to the UserMotion REST API.',
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Basic ${settings.apiKey}`, 'Content-Type': 'application/json' }
    }
  },
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your UserMotion API Key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.usermotion.com/v1/verify', { method: 'POST' })
    }
  },
  presets,
  actions: {
    identify
  }
}

export default destination
