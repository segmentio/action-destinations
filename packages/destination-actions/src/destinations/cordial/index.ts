import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createContactactivity from './createContactactivity'
import upsertContact from './upsertContact'
import addContactToList from './addContactToList'
import removeContactFromList from './removeContactFromList'

const destination: DestinationDefinition<Settings> = {
  name: 'Cordial (Actions)',
  description: 'Sync Segment Users, Groups and Events to Cordial',
  slug: 'actions-cordial',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Cordial API Key',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Endpoint',
        description:
          "Cordial API endpoint. Leave default, unless you've been provided with another one. [See more details](https://support.cordial.com/hc/en-us/sections/200553578-REST-API-Introduction-and-Overview)",
        type: 'string',
        required: true,
        format: 'uri',
        choices: [
          { label: 'USW1	(https://integrations-ingest-svc.usw1.cordial.com)', value: 'https://integrations-ingest-svc.usw1.cordial.com' },
          { label: 'USW2	(https://integrations-ingest-svc.usw2.cordial.com)', value: 'https://integrations-ingest-svc.usw2.cordial.com' },
          { label: 'Staging	(https://integrations-ingest-svc.stg.cordialdev.com)', value: 'https://integrations-ingest-svc.stg.cordialdev.com' }
        ],
        default: 'https://integrations-ingest-svc.usw1.cordial.com'
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(settings.endpoint + '/api/checkAuth')
    }
  },

  extendRequest({ settings }) {
    return { username: settings.apiKey }
  },

  actions: {
    createContactactivity,
    upsertContact,
    addContactToList,
    removeContactFromList
  }
}

export default destination
