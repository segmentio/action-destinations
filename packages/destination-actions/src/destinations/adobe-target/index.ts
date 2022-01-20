import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import updateProfile from './updateProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Adobe Target Cloud Mode',
  slug: 'actions-adobe-target-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'The Target client code to which the profile is associated',
        type: 'string',
        required: true
      },
      id_type: {
        label: 'ID Type',
        description: 'The type of ID', // TODO: Get a better description
        type: 'string',
        choices: [
          {
            value: 'mbox3rdPartyId',
            label: 'mbox3rdPartyId'
          },
          {
            value: 'PCID',
            label: 'PCID'
          }
        ],
        default: 'mbox3rdPartyId',
        required: true
      }
    }
  },
  actions: {
    updateProfile
  }
}

export default destination
