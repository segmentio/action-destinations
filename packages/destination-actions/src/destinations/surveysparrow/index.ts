import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createContact from './createContact'

import triggerSurvey from './triggerSurvey'

const destination: DestinationDefinition<Settings> = {
  name: 'Surveysparrow',
  slug: 'actions-surveysparrow',
  mode: 'cloud',
  description: 'Trigger Surveys and Create Contacts in SurveySparrow',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'Access Token',
        description:
          'SurveySparrow Access Token can be found in Settings > Apps and Integrations > Create a Custom app',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`https://api.surveysparrow.com/v3/users`, {
        method: 'get'
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Bearer ${settings.apiToken}` }
    }
  },

  actions: {
    createContact,
    triggerSurvey
  }
}

export default destination
