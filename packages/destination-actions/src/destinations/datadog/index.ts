import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendEventV2 from './sendEventV2'

const destination: DestinationDefinition<Settings> = {
  name: 'Datadog',
  slug: 'datadog',
  mode: 'cloud',

  description:
    'Send Segment events to Datadog as structured events using the Datadog API. Supports alert and change event categories in Datadog Event Management.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Datadog API Key. Found in your Datadog dashboard under Organization Settings → API Keys.',
        type: 'password',
        required: true
      },
      appKey: {
        label: 'Application Key',
        description:
          'Your Datadog Application Key. Found in Organization Settings → Application Keys. Required for sending events to Datadog Event Management.',
        type: 'password',
        required: true
      },
      site: {
        label: 'Datadog Site',
        description: 'Your Datadog site region. Determines which regional API endpoint is used for all requests.',
        type: 'string',
        required: false,
        default: 'datadoghq.com',
        choices: [
          { label: 'US1 (datadoghq.com)', value: 'datadoghq.com' },
          { label: 'US3 (us3.datadoghq.com)', value: 'us3.datadoghq.com' },
          { label: 'US5 (us5.datadoghq.com)', value: 'us5.datadoghq.com' },
          { label: 'AP1 (ap1.datadoghq.com)', value: 'ap1.datadoghq.com' },
          { label: 'AP2 (ap2.datadoghq.com)', value: 'ap2.datadoghq.com' },
          { label: 'EU1 (datadoghq.eu)', value: 'datadoghq.eu' },
          { label: 'US1-FED / GovCloud (ddog-gov.com)', value: 'ddog-gov.com' }
        ]
      }
    },
    testAuthentication: (request, { settings }) => {
      const site = settings.site || 'datadoghq.com'
      return request(`https://api.${site}/api/v1/validate`, {
        method: 'GET'
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'DD-API-KEY': settings.apiKey,
        'DD-APPLICATION-KEY': settings.appKey,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    sendEventV2
  }
}

export default destination
