import { defaultValues } from '@segment/actions-core'
import trackApplicationInstalled from './trackApplicationInstalled'
import trackApplicationOpened from './trackApplicationOpened'
import trackApplicationUninstalled from './trackApplicationUninstalled'
import createUpdatePerson from './createUpdatePerson'
import trackEvent from './trackEvent'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { AccountRegion } from './utils'

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
    trackApplicationInstalled,
    trackApplicationUninstalled,
    trackApplicationOpened,
    createUpdatePerson,
    trackEvent
  },

  presets: [
    {
      name: 'Create or Update Person',
      subscribe: 'type = "identify"',
      partnerAction: 'createUpdatePerson',
      mapping: defaultValues(createUpdatePerson.fields)
    },
    {
      name: 'Track Application Installed Event',
      subscribe: 'type = "track" and event = "Application Installed"',
      partnerAction: 'trackApplicationInstalled',
      mapping: defaultValues(trackApplicationInstalled.fields)
    },
    {
      name: 'Track Application Opened Event',
      subscribe: 'type = "track" and event = "Application Opened"',
      partnerAction: 'trackApplicationOpened',
      mapping: defaultValues(trackApplicationOpened.fields)
    },
    {
      name: 'Track Application Uninstalled Event',
      subscribe: 'type = "track" and event = "Application Uninstalled"',
      partnerAction: 'trackApplicationUninstalled',
      mapping: defaultValues(trackApplicationUninstalled.fields)
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    }
  ]
}

export default destination
