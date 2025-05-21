import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import removeContactFromList from './removeContactFromList'
import enrolContact from './enrolContact'
import addContactToList from './addContactToList'
const destination: DestinationDefinition<Settings> = {
  name: 'Dotdigital',
  slug: 'actions-dotdigital',
  description: 'Add and remove Contacts from Dotdigital lists, and enrol Contacts in Dotdigital Programs.',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      api_host: {
        label: 'Region',
        description: 'The region your account is in',
        type: 'string',
        choices: [
          { value: 'https://r1-api.dotdigital.com', label: 'r1' },
          { value: 'https://r2-api.dotdigital.com', label: 'r2' },
          { value: 'https://r3-api.dotdigital.com', label: 'r3' }
        ],
        default: 'https://r1-api.dotdigital.com',
        required: true
      },    
      username: {
        label: 'Username',
        description: 'Your Dotdigital username',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'Your Dotdigital password.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(`${settings.api_host}/v2/data-fields/`)
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.username,
      password: settings.password
    }
  },

  actions: {
    removeContactFromList,
    enrolContact,
    addContactToList
  }
}

export default destination
