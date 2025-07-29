import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncModelToSFTP from './syncModelToSFTP'
import syncToSFTP from './syncToSFTP'

const destination: DestinationDefinition<Settings> = {
  name: 'SFTP',
  slug: 'actions-sftp',
  mode: 'cloud',
  description: 'Sync Segment events to SFTP',
  authentication: {
    scheme: 'custom',
    fields: {
      auth_type: {
        label: 'Authentication Type',
        description: 'The type of authentication to use for the SFTP connection',
        type: 'string',
        choices: [
          { label: 'Username and Password', value: 'password' },
          { label: 'Username and SSH Key', value: 'ssh_key' }
        ],
        default: 'password',
        required: true
      },
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
        required: {
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'password'
            }
          ]
        },
        depends_on: {
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'password'
            }
          ]
        }
      },
      sftp_ssh_key: {
        label: 'SSH Key',
        description: 'SSH Key for establishing an SFTP connection.',
        type: 'password',
        required: {
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'ssh_key'
            }
          ]
        },
        depends_on: {
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'ssh_key'
            }
          ]
        }
      }
    }
  },
  actions: {
    syncToSFTP,
    syncModelToSFTP
  }
}

export default destination
