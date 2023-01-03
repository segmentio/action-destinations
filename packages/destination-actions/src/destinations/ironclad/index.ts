import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import viewContract from './viewContract'

const destination: DestinationDefinition<Settings> = {
  name: 'Ironclad',
  slug: 'actions-ironclad',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      sid: {
        label: 'Site Access ID',
        description:
          'Site Access ID. An ID that’s unique for each Site within your account. Information on finding your sid can be found in the Authentication section.',
        type: 'string',
        default: '',
        required: true
      },
      staging_endpoint: {
        label: 'Staging Endpoint',
        description:
          'Turn this ON, to send requests to the staging server, ONLY if Clickwrap support instructs you to do so.',
        type: 'boolean',
        required: true,
        default: false
      },
      test_mode: {
        label: 'Test Mode',
        description:
          'Test Mode, whether or not to process the acceptance in test_mode. Defaults to false, Toggle to ON to enable it.',
        type: 'boolean',
        required: true,
        default: false
      }
    }
  },

  actions: {
    viewContract
  }
}

export default destination
