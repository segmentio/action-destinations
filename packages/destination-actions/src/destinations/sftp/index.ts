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
    fields: {
      sftp_host: {
        label: 'SFTP Host',
        description: 'The hostname or IP address of the SFTP server',
        type: 'string',
        required: true
      },
      sftp_port: {
        label: 'SFTP Port',
        description: 'The port number for the SFTP connection',
        type: 'number',
        required: false,
        default: 22
      },
      sftp_username: {
        label: 'Username',
        description: 'User credentials for establishing an SFTP connection',
        type: 'string',
        required: true
      },
      sftp_password: {
        label: 'Password',
        description: 'User credentials for establishing an SFTP connection',
        type: 'password',
        required: true
      }
    }
  },
  actions: {
    syncToSFTP
  }
}

export default destination
