import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import event from './event'

import identify from './identify'
import e from 'cors'

const destination: DestinationDefinition<Settings> = {
  name: 'Posthog',
  slug: 'actions-posthog',
  mode: 'cloud',
  description: 'Send events server-side to the [Posthog REST API](https://posthog.com/docs/api).',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Found in your project settings, under "Project API key"',
        type: 'password',
        required: true
      },
      project_id: {
        label: 'Project ID',
        description: 'Found in your project settings, under "Project ID"',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Project Region',
        description: 'API Endpoint URL based on project region',
        type: 'string',
        format: 'uri',
        choices: [
          { label: 'US Cloud (https://us.i.posthog.com)', value: 'https://us.i.posthog.com' },
          { label: 'EU Cloud (https://eu.i.posthog.com)', value: 'https://eu.i.posthog.com' }
        ],
        default: 'https://us.i.posthog.com',
        required: true
      },
      historical_migration: {
        label: 'Historical Migration',
        description:
          'If enabled, this ensures that events are processed in order without triggering our spike detection systems. Affects events sent via the track Action only.',
        type: 'boolean',
        default: false,
        required: true
      }
    }
  },
  actions: {
    event,
    identify
  },
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'event',
      mapping: defaultValues(event.fields),
      type: 'automatic'
    },
    {
      name: 'Page View',
      subscribe: 'type = "page"',
      partnerAction: 'event',
      mapping: { 
        ...defaultValues(event.fields),
        event_type: 'page',
        event_name: '$pageview',
      },
      type: 'automatic'
    },
    {
      name: 'Screen View',
      subscribe: 'type = "screen"',
      partnerAction: 'event',
      mapping: { 
        ...defaultValues(event.fields),
        event_type: 'screen',
        event_name: '$screenview',
      },
      type: 'automatic'
    },
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    }
  ]
}

export default destination
