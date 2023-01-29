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
        type: 'string',
        required: true
      },
      customURL: {
        label: 'Custom Voucherify URL',
        description: 'Enter your [Voucherify URL](https://docs.voucherify.io/docs/api-endpoints).',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const testAuthenticationEndpoint = `${settings.customURL}/test-authentication`
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
      name: 'Track Custom Event',
      subscribe: 'type = "track" or type = "page" or type = "screen"',
      partnerAction: 'addCustomEvent',
      mapping: defaultValues(addCustomEvent.fields)
    },
    {
      name: 'Identify Customer',
      subscribe: 'type = "identify"',
      partnerAction: 'upsertCustomer',
      mapping: defaultValues(upsertCustomer.fields)
    },
    {
      name: 'Add Group To Customer Metadata',
      subscribe: 'type = "group"',
      partnerAction: 'assignCustomerToGroup',
      mapping: defaultValues(assignCustomerToGroup.fields)
    }
  ]
}

export default destination
