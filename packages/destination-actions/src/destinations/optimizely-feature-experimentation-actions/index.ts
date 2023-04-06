import type { DestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Feature Experimentation (Actions)',
  slug: 'actions-optimizely-feature-experimentation-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      accessToken: {
        label: 'Personal Access Token',
        description: 'Personal Access Token which client generated manually.',
        type: 'password',
        required: false
      },
      accountId: {
        label: 'Optimizely Account Id',
        type: 'string',
        required: true,
        description:
          'In order to use Optimizely Feature Experimentation (Actions) via server side, you must enter your Account ID from your Optimizely account. You can find this ID by visiting https://app.optimizely.com/v2/accountsettings/account/plan'
      },
      dataFileUrl: {
        label: 'Datafile URL',
        type: 'string',
        required: true,
        format: 'uri',
        description:
          'In order to use Optimizely Feature Experimentation (Actions) server side, you must enter the entire URL for your datafile. It should look something like https://cdn.optimizely.com/json/9218021209.json'
      }
    },
    testAuthentication: (request, { settings }) => {
      const { dataFileUrl } = settings
      return request(dataFileUrl)
    }
  },
  onDelete: async (request, { settings }) => {
    if (!settings.accessToken) {
      throw new IntegrationError('Access Token is required for user deletion.', 'REQUIRED_ACCESS_TOKEN', 400)
    }

    return request('https://api.optimizely.com/v2/subject-access-requests', {
      method: 'post',
      headers: { Authorization: `Bearer ${settings?.accessToken}` },
      json: {
        data_type: 'visitor',
        identifier: settings.accountId,
        identifier_type: 'dcp_id',
        request_type: 'delete'
      }
    })
  },

  actions: {
    trackEvent
  }
}

export default destination
