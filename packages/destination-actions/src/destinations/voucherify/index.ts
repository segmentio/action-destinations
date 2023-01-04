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
        default: AccountRegion.EU,
        required: true
      }
    }
    // Maybe for future use - testing authentication
    // testAuthentication: (request) => {
    //   return request('http://localhost:3005/segmentio/event-processing', {
    //     headers: { 'Content-Type': 'application/json' }
    //   })
    // }
  },
  extendRequest({ settings }) {
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
