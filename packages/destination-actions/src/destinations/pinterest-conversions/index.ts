import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import reportConversionEvent from './reportConversionEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Pinterest Conversions API',
  slug: 'actions-pinterest-conversions-api',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      ad_account_id: {
        label: 'Ad Account ID',
        description:
          'Unique identifier of an ad account. This can be found in the Pinterest UI by following the steps mentioned [here](https://developers.pinterest.com/docs/conversions/conversion-management/#Finding%20your%20%2Cad_account_id).',
        type: 'string',
        required: true
      },
      conversion_token: {
        label: 'Conversion Token',
        description:
          'The conversion token for your Pinterest account. This can be found in the Pinterest UI by following the steps mentioned [here](https://developers.pinterest.com/docs/conversions/conversion-management/#Authenticating%20for%20the%20send%20conversion%20events%20endpoint).',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  actions: {
    reportConversionEvent
  }
}

export default destination
