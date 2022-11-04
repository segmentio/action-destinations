import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Optimizely Full Stack',
  slug: 'actions-optimizely-full-stack',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      accountId: {
        label: 'Optimizely Account Id',
        type: 'string',
        required: true,
        description:
          'In order to use Optimizely X via server side, you must enter your Account ID from your Optimizely account. You can find this ID by visiting https://app.optimizely.com/v2/accountsettings/account/plan'
      },
      dataFileUrl: {
        label: 'Datafile URL',
        type: 'string',
        required: true,
        description:
          'In order to use Optimizely X server side, you must enter the entire URL for your datafile. It should look something like https://cdn.optimizely.com/json/9218021209.json'
      }
    },
    testAuthentication: (request, { settings }) => {
      const { dataFileUrl } = settings
      return request(dataFileUrl)
    }
  },
  actions: {
    trackEvent
  }
}

export default destination
