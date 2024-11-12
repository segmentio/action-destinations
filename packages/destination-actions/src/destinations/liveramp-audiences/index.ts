import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import audienceEnteredS3 from './audienceEnteredS3'
import audienceEnteredSFTP from './audienceEnteredSftp'

const destination: DestinationDefinition<Settings> = {
  name: 'Liveramp Audiences',
  slug: 'actions-liveramp-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      __segment_internal_engage_force_full_sync: {
        label: 'Force Full Sync',
        description: '',
        type: 'boolean',
        required: true,
        default: true
      },
      __segment_internal_engage_batch_sync: {
        label: 'Supports batch sync via ADS',
        description: '',
        type: 'boolean',
        required: true,
        default: true
      }
    }
  },
  actions: {
    audienceEnteredS3,
    audienceEnteredSFTP
  }
}

export default destination
