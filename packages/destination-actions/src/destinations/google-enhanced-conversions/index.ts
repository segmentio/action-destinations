import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import postConversion from './postConversion'
import uploadCallConversion from './uploadCallConversion'
import uploadClickConversion from './uploadClickConversion'
import uploadConversionAdjustment from './uploadConversionAdjustment'

interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}
/*
interface UserInfoResponse {
  name?: string
  email: string
}
*/

const destination: DestinationDefinition<Settings> = {
  // NOTE: We need to match the name with the creation name in DB.
  // This is not the value used in the UI.
  name: 'Google Ads Conversions',
  slug: 'actions-google-enhanced-conversions',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      conversionTrackingId: {
        label: 'Conversion ID',
        description:
          'You will find this information in the event snippet for your conversion action, for example `send_to: AW-CONVERSION_ID/AW-CONVERSION_LABEL`. In the sample snippet, AW-CONVERSION_ID stands for the conversion ID unique to your account. Enter the conversion ID, without the AW- prefix. **Required if you are using a mapping that sends data to the legacy Google Enhanced Conversions API (i.e. Upload Enhanced Conversion (Legacy) Action).**',
        type: 'string'
      },
      customerId: {
        label: 'Customer ID',
        description:
          'ID of your Google Ads Account. This should be 10-digits and in XXX-XXX-XXXX format. **Required if you are using a mapping that sends data to the Google Ads API.**',
        type: 'string'
      }
    },
    testAuthentication: async (_request) => {
      /* NOTE: Commenting this out until we surface the OAuth login flow in the Actions configuration wizard
      const res = await request<UserInfoResponse>('https://www.googleapis.com/oauth2/v3/userinfo', {
        method: 'GET'
      })

      return { name: res.data.name || res.data.email }
      */
      return true
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  actions: {
    postConversion,
    uploadClickConversion,
    uploadCallConversion,
    uploadConversionAdjustment
  }
}

export default destination
