import { GQL_ENDPOINT, EXTERNAL_PROVIDER } from '../functions'

export async function onDelete(request: any, payload: any[]) {
  return (async () => {
    const userId = payload[0].userId ?? payload[0].anonymousId
    const TokenQuery = `query TokenInfo {
      tokenInfo {
        scopesByAdvertiser {
          nodes {
            advertiser {
              id
            }
          }
          totalCount
        }
      }
    }`

    const res_token = await request(GQL_ENDPOINT, {
      body: JSON.stringify({ query: TokenQuery }),
      throwHttpErrors: false
    })

    if (res_token.status !== 200) {
      throw new Error('Failed to fetch advertiser information: ' + res_token.statusText)
    }

    const result_token = await res_token.json()
    const advertiserNode = result_token.data?.tokenInfo?.scopesByAdvertiser?.nodes

    if (!advertiserNode || advertiserNode.length === 0) {
      throw new Error('No advertiser ID found.')
    }

    const advertiserIds = advertiserNode.map((node: { advertiser: { id: string } }) => node.advertiser.id)

    const formattedExternalIds = `["${userId}"]`
    const formattedAdvertiserIds = `[${advertiserIds.map((id: string) => `"${id}"`).join(', ')}]`

    const query = `mutation {
      deleteProfilesWithExternalIds(
        externalIds: ${formattedExternalIds},
        advertiserIDs: ${formattedAdvertiserIds},
        externalProvider: "${EXTERNAL_PROVIDER}"
      ) {
        userErrors {
          message
          path
        }
      }
    }`

    const res = await request(GQL_ENDPOINT, {
      body: JSON.stringify({ query }),
      throwHttpErrors: false
    })

    if (res.status !== 200) {
      throw new Error('Failed to delete profile: ' + res.statusText)
    }

    const result = await res.json()

    if (result.data.deleteProfilesWithExternalIds.userErrors.length > 0) {
      throw new Error(
        'Profile deletion was not successful: ' +
          result.data.deleteProfilesWithExternalIds.userErrors.map((e: any) => e.message).join(', ')
      )
    }

    return result
  })()
}
