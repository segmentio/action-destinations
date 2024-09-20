import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import syncAudience from './syncAudience'
import { CreateAudienceReq, CreateAudienceResp } from './types'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Reddit Audiences',
  slug: 'actions-reddit-audiences',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      ad_account_id: {
        type: 'string',
        label: 'Ad Account ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const res = await request('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        username: auth.clientId,
        password: auth.clientSecret,
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          grant_type: 'refresh_token'
        })
      })
      const responseData = res.data as { access_token: string }
      return { accessToken: responseData.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzI2OTM3MTQ4Ljc0MDM1MywiaWF0IjoxNzI2ODUwNzQ4Ljc0MDM1MywianRpIjoiQ0VNeldFNFV2eVdQLVkxWHB5N19FMWFWbmF1dUNRIiwiY2lkIjoiOWtYLUJWQlFTVWlZWEx4QmZGdzcyZyIsImxpZCI6InQyXzN4OWkyMnQwIiwiYWlkIjoidDJfM3g5aTIydDAiLCJsY2EiOjE1NjAyMDQyNTg0MzMsInNjcCI6ImVKeUtWaXBLVFV4UjBsRktUQ21Hc2pJeWkwdnlpeW9oWXFrcG1TVVFWbkotWGxscVVYRm1mbDZ4VWl3Z0FBRF9fd0NaRXc0IiwicmNpZCI6IjFRc3Q1ZFJnM1lrZkFHb3VJYnp2a3RzOGN6el9pOHU1Y3p3Z05vV2pHWmciLCJmbG8iOjN9.aoUBexJSDjGtef-8hKTstJtg_Xc2efVQX92t3E_XhQ_Hul5vdfXOCdN5EfEvWGkhw4oD7Jv8nNUq5o3mkKwz7DhzGGuvGG2ESJg9YVfwabOf61rkyQOQObt5bFW-wIqYrslTfG7wm8xn6Ng_3mabGXpMntZ6ZtBf6WgcL2iyXaTcOhtHB3nBCXCCvib_EbM5_l3e5MiQ0l7CK5ma5Whzyp135zP9ugFkrVndjc-u_o6p5Iy_SicOAHABm9qOip865GBgcRNMKeW3Ohms39iFvTjft8UlDbMx5jMWdJp0XfNUTuV0aygyqPkXZKPSDS2L_MLGaZ5Yrx-yetRbkiDdIg`
      }
    }
  },
  audienceFields: {
    audienceName: {
      label: 'Audience Name',
      description: 'An audience name to display in Reddit',
      type: 'string',
      required: true
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const response = await request<CreateAudienceResp>(`https://ads-api.reddit.com/api/v3/ad_accounts/${createAudienceInput.settings.ad_account_id}/custom_audiences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          data: {
            name: createAudienceInput.audienceName,
            type: 'CUSTOMER_LIST'
          }
        } as CreateAudienceReq
      })
      const jsonOutput = await response.json()
      return { externalId: (jsonOutput.data.id) }
    },
    async getAudience(_, getAudienceInput) {
      return {
        externalId: getAudienceInput.externalId
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
