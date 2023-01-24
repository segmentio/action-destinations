import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { RequestClient } from '@segment/actions-core'

import addContactToXmd from './addContactToXmd'
import triggerXflowWorkflow from './triggerXflowWorkflow'
import QualtricsApiClient from './qualtricsApiClient'

const destination: DestinationDefinition<Settings> = {
  name: 'Qualtrics',
  slug: 'actions-qualtrics',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'API Token',
        description: 'Qualtrics API token found in your Qualtrics account under "Account settings" -> "Qualtrics IDs."',
        type: 'string',
        required: true
      },
      datacenter: {
        label: 'Datacenter ID',
        description:
          'Qualtrics datacenter id that identifies where your qualtrics instance is located. Found under "Account settings" -> "Qualtrics IDs".',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request: RequestClient, input) => {
      const apiClient = new QualtricsApiClient(input.settings.datacenter, input.settings.apiToken, request)
      return apiClient.whoaAmI()
    }
  },
  actions: {
    addContactToXmd,
    triggerXflowWorkflow
  }
}

export default destination
