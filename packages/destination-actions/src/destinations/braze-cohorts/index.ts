import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudiences from './syncAudiences'

const destination: DestinationDefinition<Settings> = {
  name: 'Braze Cohorts',
  slug: 'actions-braze-cohorts',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      client_secret: {
        label: 'Client Secret key',
        description: 'Data Import Key for the client whose cohort this belongs to. Also known as customer key.',
        type: 'password',
        required: true
      },
      endpoint: {
        label: 'REST Endpoint',
        description: 'Your Braze REST endpoint. [See more details](https://www.braze.com/docs/api/basics/#endpoints)',
        type: 'string',
        format: 'uri',
        choices: [
          { label: 'US-01	(https://dashboard-01.braze.com)', value: 'https://rest.iad-01.braze.com' },
          { label: 'US-02	(https://dashboard-02.braze.com)', value: 'https://rest.iad-02.braze.com' },
          { label: 'US-03	(https://dashboard-03.braze.com)', value: 'https://rest.iad-03.braze.com' },
          { label: 'US-04	(https://dashboard-04.braze.com)', value: 'https://rest.iad-04.braze.com' },
          { label: 'US-05	(https://dashboard-05.braze.com)', value: 'https://rest.iad-05.braze.com' },
          { label: 'US-06	(https://dashboard-06.braze.com)', value: 'https://rest.iad-06.braze.com' },
          { label: 'US-08	(https://dashboard-08.braze.com)', value: 'https://rest.iad-08.braze.com' },
          { label: 'EU-01	(https://dashboard-01.braze.eu)', value: 'https://rest.fra-01.braze.eu' },
          { label: 'EU-02	(https://dashboard-02.braze.eu)', value: 'https://rest.fra-02.braze.eu' }
        ],
        default: 'https://rest.iad-01.braze.com',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${settings.endpoint}/partners/segment/cohorts/users`, {
        method: 'post',
        json: {
          client_secret: settings.client_secret,
          partner_api_key: settings.endpoint.includes('eu')
            ? process.env.BRAZE_COHORTS_PARTNER_API_KEY_EU
            : process.env.BRAZE_COHORTS_PARTNER_API_KEY_US,
          cohort_id: 'will_add_in_constant',
          cohort_changes: []
        }
      })
    }
  },
  actions: {
    syncAudiences
  }
}

export default destination
