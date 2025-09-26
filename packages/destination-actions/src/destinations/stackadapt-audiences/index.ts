import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import forwardProfile from './forwardProfile'
import forwardAudienceEvent from './forwardAudienceEvent'
import { AdvertiserScopesResponse } from './types'
import { GQL_ENDPOINT, EXTERNAL_PROVIDER, sha256hash } from './functions'

const destination: DestinationDefinition<Settings> = {
  name: 'StackAdapt Audiences',
  slug: 'actions-stackadapt-audiences',
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
        label: "Advertiser ID",
        description: "The StackAdapt advertiser ID to add the profile to. The value in this field field can also be overridden at the Action level via the Action field of the same name.",
        type: 'string', 
        required: false,
        disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
        dynamic: async (request, { settings }) => {
          if (!settings?.apiKey) {
            return {
              choices: [],
              error: {
                message: 'Please configure the API Key field before setting the Advertiser field value',
                code: 'API Key Missing'
              }
            }
          }

          try {
            const query = `query {
              tokenInfo {
                scopesByAdvertiser {
                  nodes {
                    advertiser {
                      id
                      name
                    }
                    scopes
                  }
                }
              }
            }`
            
            const response = await request<AdvertiserScopesResponse>(GQL_ENDPOINT, {
              body: JSON.stringify({ query })
            })
            
            const scopesByAdvertiser = response.data?.data?.tokenInfo?.scopesByAdvertiser
            const choices = scopesByAdvertiser?.nodes
              .filter((advertiserEntry: any) => advertiserEntry.scopes.includes('WRITE'))
              .map((advertiserEntry: any) => ({ 
                value: advertiserEntry.advertiser.id, 
                label: advertiserEntry.advertiser.name 
              }))
              .sort((a: any, b: any) => a.label.localeCompare(b.label))
            
            return { choices }
          } catch (error: any) {
            return {
              choices: [],
              error: {
                message: error.message ?? 'Unknown error',
                code: error.status?.toString() ?? 'Unknown error'
              }
            }
          }
        }
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
    const advertiserId = settings.advertiser_id as string

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
    forwardProfile,
    forwardAudienceEvent
  }
}

export default destination
