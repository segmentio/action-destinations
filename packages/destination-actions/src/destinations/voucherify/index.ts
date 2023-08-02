/* eslint-disable no-useless-escape */
import { DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import upsertCustomer from './upsertCustomer'
import { defaultValues } from '@segment/actions-core'
import addCustomEvent from './addCustomEvent'
import assignCustomerToGroup from './assignCustomerToGroup'
import { validateURL } from './url-validator'

const destination: DestinationDefinition<Settings> = {
  name: 'Voucherify (Actions)',
  slug: 'voucherify-actions',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'Application ID',
        description:
          'Application ID can be found in [Voucherify dashboard](https://docs.voucherify.io/docs/authentication).',
        type: 'string',
        required: true
      },
      secretKey: {
        label: 'Secret Key',
        description:
          'Secret Key can be found in [Voucherify dashboard](https://docs.voucherify.io/docs/authentication).',
        type: 'password',
        required: true
      },
      customURL: {
        label: 'Custom Voucherify URL',
        description:
          'Check your API region in [Voucherify dashboard](https://app.voucherify.io/#/login) -> Project settings -> API endpoint. For example, if you are using a project with a URL: `https://us1.api.voucherify.io`, your Custom URL will be: `https://us1.segmentio.voucherify.io`. It also works for dedicated URLs.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const testAuthenticationEndpoint = `${settings.customURL}/segmentio/test-authentication`
      const authenticationResponse = await request(testAuthenticationEndpoint, {
        headers: {
          authorization: `Basic ${Buffer.from(settings.apiKey).toString('base64')}`,
          'secret-key': Buffer.from(settings.secretKey).toString('base64')
        }
      })
      if (authenticationResponse.status === 401) {
        throw new Error(authenticationResponse.status + ': ' + authenticationResponse.statusText)
      }
    }
  },
  extendRequest({ settings }) {
    if (!settings.apiKey || !settings.secretKey) {
      throw new Error('The request is missing Application ID or Secret Key.')
    }

    validateURL(settings)

    return {
      headers: {
        authorization: `Basic ${Buffer.from(settings.apiKey).toString('base64')}`,
        'secret-key': Buffer.from(settings.secretKey).toString('base64')
      }
    }
  },
  actions: {
    upsertCustomer,
    addCustomEvent,
    assignCustomerToGroup
  },
  presets: [
    {
      name: 'Add Custom Event (Track Event)',
      subscribe: 'type = "track"',
      partnerAction: 'addCustomEvent',
      mapping: defaultValues(addCustomEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Add Custom Event (Page Event)',
      subscribe: 'type = "page"',
      partnerAction: 'addCustomEvent',
      mapping: {
        ...defaultValues(addCustomEvent.fields),
        event: {
          '@template': 'Viewed {{name}} Page'
        }
      },
      type: 'automatic'
    },
    {
      name: 'Add Custom Event (Screen Event)',
      subscribe: 'type = "screen"',
      partnerAction: 'addCustomEvent',
      mapping: {
        ...defaultValues(addCustomEvent.fields),
        event: {
          '@template': 'Viewed {{name}} Screen'
        }
      },
      type: 'automatic'
    },
    {
      name: 'Create Or Update Customer',
      subscribe: 'type = "identify"',
      partnerAction: 'upsertCustomer',
      mapping: defaultValues(upsertCustomer.fields),
      type: 'automatic'
    },
    {
      name: 'Assign Customer To Group',
      subscribe: 'type = "group"',
      partnerAction: 'assignCustomerToGroup',
      mapping: defaultValues(assignCustomerToGroup.fields),
      type: 'automatic'
    }
  ]
}

export default destination
