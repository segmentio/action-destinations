import { DestinationDefinition } from '@segment/actions-core'
import { AccountRegion } from '../customerio/utils'
import { Settings } from './generated-types'
import identifyCustomer from './identifyCustomer'

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
  },
  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Basic ${Buffer.from(settings.apiKey).toString('base64')}`,
        'secret-key': settings.secretKey
      }
    }
  },
  actions: {
    identifyCustomer
  }
}

export default destination
