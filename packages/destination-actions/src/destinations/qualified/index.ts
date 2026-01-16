import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import upsertLead from './upsertLead'
import updateCompany from './updateCompany'

const destination: DestinationDefinition<Settings> = {
  name: 'Qualified',
  slug: 'actions-qualified',
  mode: 'cloud',
  description: 'Qualified is a Conversational Marketing platform that helps B2B companies engage and convert website visitors into customers using real-time chat, AI-driven insights, and personalized experiences.',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Your Qualified API Key. When creating the API Key in Qualified make sure to select all scopes.',
        type: 'string',
        format: 'password',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      }
    }
  },
  actions: {
    upsertLead,
    updateCompany
  }
}

export default destination
