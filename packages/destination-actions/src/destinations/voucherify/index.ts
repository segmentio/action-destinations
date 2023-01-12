/* eslint-disable no-useless-escape */
import { DestinationDefinition } from '@segment/actions-core'
import { AccountRegion } from '../voucherify/utils'
import { Settings } from './generated-types'
import identifyCustomer from './identifyCustomer'
import trackEvent from './trackEvent'
import pageEvent from './pageEvent'
import screenEvent from './screenEvent'
import groupEvent from './groupEvent'

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
      apiEndpoint: {
        label: 'Api Endpoint',
        description: 'Set your [Api Endpoint](https://docs.voucherify.io/docs/api-endpoints).',
        type: 'string',
        choices: Object.values(AccountRegion).map((v) => ({ label: v, value: v })),
        default: AccountRegion.EU
      },
      customURL: {
        label: 'Custom Voucherify  URL',
        description: 'If you do not want to use the default Voucherify URL, then enter your own here.',
        type: 'string'
      }
    }
  },
  extendRequest({ settings }) {
    if (!settings.apiKey || !settings.secretKey) {
      throw new Error('The request is missing Application ID or Secret Key.')
    }

    if (settings.customURL) {
      const urlRegEx =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
      const regExMatcher = new RegExp(urlRegEx)
      const isCustomURLValid = typeof settings.customURL === 'string' && regExMatcher.test(settings.customURL)

      if (!isCustomURLValid) {
        throw new Error(
          `The Custom URL: ${settings.customURL} is invalid. It probably lacks the HTTP/HTTPS protocol or has an incorrect format.`
        )
      }
    }

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
