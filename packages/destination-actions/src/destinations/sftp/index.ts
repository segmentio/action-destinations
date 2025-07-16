import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncToSFTP from './syncToSFTP'

const destination: DestinationDefinition<Settings> = {
  name: 'SFTP',
  slug: 'actions-sftp',
  mode: 'cloud',
  description: 'Sync Segment event data to SFTP.',

  authentication: {
    scheme: 'custom',
    fields: {}
  },
  actions: {
    syncToSFTP
  }
}

export default destination
