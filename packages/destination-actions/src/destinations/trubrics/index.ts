import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import track from './track'
import identify from './identify'

const destination: DestinationDefinition<Settings> = {
  name: 'Trubrics',
  slug: 'actions-trubrics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'Project API Key',
        description: 'Your Trubrics Project API Key. This can be found in your project settings.',
        type: 'string',
        required: true
      },
      url: {
        label: 'Project URL',
        description: 'The Trubrics API URL. In most cases the default value should be used.',
        type: 'string',
        required: true,
        default: 'app.trubrics.com/api/ingestion'
      }
    }
  },
  actions: {
    track,
    identify
  }
}

export default destination
