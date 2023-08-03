import { defaultValues } from '@segment/actions-core'
import createUpdateDevice from './createUpdateDevice'
import deleteDevice from './deleteDevice'
import createUpdatePerson from './createUpdatePerson'
import trackEvent from './trackEvent'
import trackPageView from './trackPageView'
import trackScreenView from './trackScreenView'
import createUpdateObject from './createUpdateObject'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { AccountRegion, trackApiEndpoint } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Customerio',
  slug: 'actions-customerio',
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
        choices: Object.values(AccountRegion).map((dc) => ({ label: dc, value: dc })),
        default: AccountRegion.US
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
    deleteDevice,
    createUpdatePerson,
    trackEvent,
    trackPageView,
    trackScreenView,
    createUpdateObject
  },

  presets: [
    {
      name: 'Create or Update Person',
      subscribe: 'type = "identify"',
      partnerAction: 'createUpdatePerson',
      mapping: defaultValues(createUpdatePerson.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update Device',
      subscribe: 'event = "Application Installed" or event = "Application Opened"',
      partnerAction: 'createUpdateDevice',
      mapping: defaultValues(createUpdateDevice.fields),
      type: 'automatic'
    },
    {
      name: 'Delete Device',
      subscribe: 'event = "Application Uninstalled"',
      partnerAction: 'deleteDevice',
      mapping: defaultValues(deleteDevice.fields),
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Track Page View',
      subscribe: 'type = "page"',
      partnerAction: 'trackPageView',
      mapping: defaultValues(trackPageView.fields),
      type: 'automatic'
    },
    {
      name: 'Track Screen View',
      subscribe: 'type = "screen"',
      partnerAction: 'trackScreenView',
      mapping: defaultValues(trackScreenView.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update Object',
      subscribe: 'type = "group"',
      partnerAction: 'createUpdateObject',
      mapping: defaultValues(createUpdateObject.fields),
      type: 'automatic'
    }
  ],

  onDelete(request, { settings, payload }) {
    const { accountRegion } = settings
    const { userId } = payload

    const url = `${trackApiEndpoint(accountRegion)}/api/v1/customers/${userId}`

    return request(url, {
      method: 'DELETE'
    })
  }
}

export default destination
