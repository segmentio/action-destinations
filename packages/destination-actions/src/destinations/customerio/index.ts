import { defaultValues } from '@segment/actions-core'
import createUpdateDevice from './createUpdateDevice'
import createUpdatePerson from './createUpdatePerson'
import trackEvent from './trackEvent'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { AccountRegion } from './utils'

import deleteDevice from './deleteDevice'

const destination: DestinationDefinition<Settings> = {
  name: 'Customer.io',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      siteId: {
        description:
          'Customer.io site ID. This can be found on your [API Credentials page](https://fly.customer.io/settings/api_credentials).',
        label: 'Site ID',
        type: 'string',
        required: true
      },
      apiKey: {
        description:
          'Customer.io API key. This can be found on your [API Credentials page](https://fly.customer.io/settings/api_credentials).',
        label: 'API Key',
        type: 'string',
        required: true
      },
      accountRegion: {
        description: 'Learn about [Account Regions](https://customer.io/docs/data-centers/).',
        label: 'Account Region',
        type: 'string',
        format: 'uri',
        choices: Object.values(AccountRegion).map((dc) => ({ label: dc, value: dc })),
        default: 'https://track.customer.io'
      }
    },
    testAuthentication: (request) => {
      return request('https://track.customer.io/auth')
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.siteId,
      password: settings.apiKey
    }
  },

  actions: {
    createUpdateDevice,
    createUpdatePerson,
    trackEvent,
    deleteDevice
  },

  presets: [
    {
      name: 'Create or Update Person',
      subscribe: 'type = "identify"',
      partnerAction: 'createUpdatePerson',
      mapping: defaultValues(createUpdatePerson.fields)
    },
    {
      name: 'Create or Update Device',
      subscribe: 'type = "track" and ( event = "Application Installed" or event = "Application Opened" )',
      partnerAction: 'createUpdateDevice',
      mapping: defaultValues(createUpdateDevice.fields)
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track" and event = "Application Uninstalled"',
      partnerAction: 'deleteDevice',
      mapping: defaultValues(deleteDevice.fields)
    }
  ]
}

export default destination
