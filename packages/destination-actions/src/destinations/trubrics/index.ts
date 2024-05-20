import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import track from './track'

const destination: DestinationDefinition<Settings> = {
  name: 'Trubrics',
  slug: 'actions-trubrics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Project API Key',
        description: 'Your Trubrics Project API Key. Can be found in your project settings.',
        type: 'string',
        required: true
      },
      url: {
        label: 'Project URL',
        description: 'The Trubrics API URL. You should use the default value.',
        type: 'string',
        required: true,
        default: 'https://api.trubrics.com'
      }
    }
  },
  actions: {
    track
  }
}

export default destination
