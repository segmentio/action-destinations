import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import logEvent from './logEvent'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'logEvent',
    mapping: defaultValues(logEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'logEvent',
    mapping: defaultValues(logEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'logEvent',
    mapping: defaultValues(logEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'logEvent',
    mapping: defaultValues(logEvent.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Kameleoon',
  slug: 'actions-kameleoon',
  mode: 'cloud',
  description: 'Send Segment events to Kameleoon',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'Kameleoon API key. You can generate one using the link in the help doc (https://help.kameleoon.com/setting-up-segment/).',
        type: 'password',
        required: true
      },
      sitecode: {
        label: 'Sitecode',
        description:
          'Kameleoon project sitecode. You can find this project dashboard (https://help.kameleoon.com/question/how-do-i-find-my-site-id/).',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (_request, { settings }) => {
      try {
        JSON.parse(Buffer.from(settings.apiKey, 'base64').toString('ascii'))
      } catch (e) {
        throw new Error('Invalid project API Key. Please check your API Key')
      }
      if (settings.sitecode.toString().length === 10) {
        return true
      } else {
        throw new Error('Invalid project sitecode. Please check your sitecode')
      }
    }
  },
  presets,
  actions: {
    logEvent
  }
}

export default destination
