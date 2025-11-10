import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import forwardAudienceEvent from './forwardAudienceEvent'
import { AdvertiserScopesResponse } from './common-types'
import { sha256hash } from './common-functions'
import { EXTERNAL_PROVIDER, GQL_ENDPOINT } from './common-constants'

const destination: DestinationDefinition<Settings> = {
  name: 'StackAdapt Audiences',
  slug: 'actions-stackadapt-audiences',
  description: 'Sync Segment Engage Audiences as well as user profile details to StackAdapt',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'GraphQL Token',
        description: 'Your StackAdapt GQL API Token',
        type: 'string',
        required: true
      },
      advertiser_id: {
        label: 'Advertiser ID',
        description: 'The StackAdapt advertiser ID to add the profile to.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request) => {
      const scopeQuery = `query {
        tokenInfo {
          scopesByAdvertiser {
            nodes {
              advertiser {
                name
              }
              scopes
            }
          }
        }
      }`

      const res = await request(GQL_ENDPOINT, {
        body: JSON.stringify({ query: scopeQuery }),
        throwHttpErrors: false
      })
      if (res.status !== 200) {
        throw new Error(res.status + res.statusText)
      }
      const canWrite = (
        (await res.json()) as AdvertiserScopesResponse
      ).data?.tokenInfo?.scopesByAdvertiser?.nodes?.some((node: { scopes: string[] }) => node.scopes.includes('WRITE'))
      if (!canWrite) {
        throw new Error('Please verify your GQL Token or contact support')
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      }
    }
  },
  onDelete: async (request, { payload, settings }) => {
    const userId = payload.userId
    const formattedExternalIds = `["${userId}"]`
    const syncId = sha256hash(String(userId))
    const advertiserId = settings.advertiser_id

    const mutation = `mutation {
      deleteProfilesWithExternalIds(
        input: {
          externalIds: ${formattedExternalIds},
          externalProvider: "${EXTERNAL_PROVIDER}",
          syncId: "${syncId}",
          advertiserIds: [${parseInt(advertiserId, 10)}]
        }
      ) {
        userErrors {
          message
          path
        }
      }
    }`

    const response = await request(GQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation })
    })

    const result: {
      data: {
        deleteProfilesWithExternalIds: {
          userErrors: { message: string }[]
        }
      }
    } = await response.json()

    if (result.data.deleteProfilesWithExternalIds.userErrors.length > 0) {
      const errorMessages = result.data.deleteProfilesWithExternalIds.userErrors.map((e) => e.message).join(', ')
      throw new IntegrationError(`Profile deletion was not successful: ${errorMessages}`, 'DELETE_FAILED', 400)
    }
    return result
  },

  actions: {
    forwardAudienceEvent
  }
}

export default destination
