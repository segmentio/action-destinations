import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import event from './event'
import identify from './identify'

const destination: DestinationDefinition<Settings> = {
  name: 'Altertable',
  slug: 'actions-altertable',
  mode: 'cloud',
  description:
    'Send events server-side to the [Altertable REST API](https://altertable.ai/docs/product-analytics/reference/api).',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Altertable API key',
        type: 'password',
        required: true
      },
      environment: {
        label: 'Environment',
        description: 'The environment to send events to',
        type: 'string',
        required: true,
        default: 'production'
      },
      endpoint: {
        label: 'Endpoint',
        description: 'The endpoint to send events to',
        type: 'string',
        format: 'uri',
        required: true,
        default: 'https://api.altertable.ai'
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        'X-API-Key': settings.apiKey,
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    event,
    identify
  },
  presets: [
    {
      name: 'Track',
      subscribe: 'type = "track"',
      partnerAction: 'event',
      mapping: {
        ...defaultValues(event.fields),
        type: 'track'
      },
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type = "page"',
      partnerAction: 'event',
      mapping: {
        ...defaultValues(event.fields),
        type: 'page'
      },
      type: 'automatic'
    },
    {
      name: 'Screen View',
      subscribe: 'type = "screen"',
      partnerAction: 'event',
      mapping: {
        ...defaultValues(event.fields),
        type: 'screen'
      },
      type: 'automatic'
    },
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: {
        ...defaultValues(identify.fields),
        type: 'identify'
      },
      type: 'automatic'
    }
  ]
}

export default destination
