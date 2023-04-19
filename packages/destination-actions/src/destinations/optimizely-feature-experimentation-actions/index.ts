import type { DestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError } from '@segment/actions-core'
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
        description:
          'The personal access token will be used to submit a GDPR delete request to Optimizely. To generate a personal access token, navigate to Profile->API Access and generate a new token.',
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
          'The datafile is a JSON representation of the current state of flags and experiments for an environment in your Full Stack project. It should look something like https://cdn.optimizely.com/json/9218021209.json'
      },
      cacheExp: {
        label: 'Cach Exp',
        type: 'number',
        required: false,
        default: 300,
        description:
          'To optimize the server side integration, we will cache the fetched Datafile that you have provided for this amount of time (in seconds) in Redis. Since the datafile should not change unless you modified the conditions or variation rules of your experiments, it is advised to have a minimum floor of 300 seconds (5 minutes).'
      }
    },
    testAuthentication: (request, { settings }) => {
      const { dataFileUrl } = settings
      return request(dataFileUrl)
    }
  },
  onDelete: async (request, { settings }) => {
    if (!settings.accessToken) {
      throw new InvalidAuthenticationError('Access Token is required for user deletion.')
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
