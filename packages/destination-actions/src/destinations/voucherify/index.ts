/* eslint-disable no-useless-escape */
import { DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import identifyCustomer from './identifyCustomer'
import trackEvent from './trackEvent'
import pageEvent from './pageEvent'
import screenEvent from './screenEvent'
import groupEvent from './groupEvent'
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
    identifyCustomer,
    trackEvent,
    pageEvent,
    screenEvent,
    groupEvent
  }
}

export default destination
