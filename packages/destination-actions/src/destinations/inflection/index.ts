import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { ENVIRONMENT } from './constants'

import track from './track'
import identify from './identify'
import group from './group'

const destination: DestinationDefinition<Settings> = {
  name: 'Inflection (Actions)',
  slug: 'actions-inflection',
  mode: 'cloud',
  description: 'Send Segment track, identify and group events to Inflection to activate growth campaigns.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Inflection API key. Contact Inflection support to have one generated for your account.',
        type: 'password',
        required: true
      },
      environment: {
        label: 'Environment',
        description: 'The Inflection environment to send events to. API keys are specific to each environment.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Production', value: ENVIRONMENT.PRODUCTION },
          { label: 'Testing', value: ENVIRONMENT.TESTING }
        ],
        default: ENVIRONMENT.PRODUCTION
      }
    }
  },
  presets: [
    {
      name: 'Track',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    },
    {
      name: 'Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields),
      type: 'automatic'
    },
    {
      name: 'Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields),
      type: 'automatic'
    }
  ],
  actions: {
    track,
    identify,
    group
  }
}

export default destination
