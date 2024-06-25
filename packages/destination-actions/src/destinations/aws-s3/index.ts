import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import uploadCsv from './uploadCsv'

const destination: DestinationDefinition<Settings> = {
  name: 'S3 CSV Audiences',
  slug: 'actions-s3-csv',
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
    uploadCsv
  }
}

export default destination
