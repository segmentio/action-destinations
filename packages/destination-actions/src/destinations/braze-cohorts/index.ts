import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { CohortChanges } from './braze-cohorts-types'
import { SyncAudiences } from './api/index'
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
    testAuthentication: async (request, { settings }) => {
      const syncAudiencesApiClient: SyncAudiences = new SyncAudiences(request, settings)
      const cohort_id = 'will_add_in_constant'
      const cohortChanges: Array<CohortChanges> = []
      return await syncAudiencesApiClient.batchUpdate(settings, cohort_id, cohortChanges)
    }
  },
  actions: {
    syncAudiences
  }
}

export default destination
