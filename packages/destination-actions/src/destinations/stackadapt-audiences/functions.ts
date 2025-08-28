import { APIError, createRequestClient, DynamicFieldResponse } from '@segment/actions-core'
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'

interface Advertiser {
  id: string
  name: string
}

interface TokenInfoResponse {
  data: {
    tokenInfo: {
      scopesByAdvertiser: {
        nodes: {
          advertiser: Advertiser
          scopes: string[]
        }[]
        pageInfo: {
          hasNextPage: boolean
          endCursor: string
        }
      }
    }
  }
}

export const EXTERNAL_PROVIDER = 'segment_io'
export const GQL_ENDPOINT = 'https://api.stackadapt.com/graphql'

export async function advertiserIdFieldImplementation(
  request: ReturnType<typeof createRequestClient>,
  { settings }: any
): Promise<DynamicFieldResponse> {
  if (!settings?.apiKey) {
    return {
      choices: [],
      nextPage: '',
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
    const response = await request<TokenInfoResponse>(GQL_ENDPOINT, {
      body: JSON.stringify({ query })
    })
    const scopesByAdvertiser = response.data.data.tokenInfo.scopesByAdvertiser
    const choices = scopesByAdvertiser.nodes
      .filter((advertiserEntry) => advertiserEntry.scopes.includes('WRITE'))
      .map((advertiserEntry) => ({ value: advertiserEntry.advertiser.id, label: advertiserEntry.advertiser.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
    return { choices }
  } catch (error) {
    return {
      choices: [],
      nextPage: '',
      error: {
        message: (error as APIError).message ?? 'Unknown error',
        code: (error as APIError).status?.toString() ?? 'Unknown error'
      }
    }
  }
}

export function sha256hash(data: string) {
  const hash = createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

// transform an array of mapping objects into a string which can be sent as parameter in a GQL request
export function stringifyJsonWithEscapedQuotes(value: unknown) {
  const jsonString = JSON.stringify(value);
  
  // Finally escape all remaining quotes
  return jsonString.replace(/"/g, '\\"');
}

// transform mapping schema for direct insertion into GraphQL queries (no quote escaping)
export function stringifyMappingSchemaForGraphQL(value: unknown) {
  let jsonString = JSON.stringify(value);
  
  // Replace "type":"VALUE" with type:VALUE (unquoted enum and field)
  jsonString = jsonString.replace(/"type":"([^"]+)"/g, (_, typeValue: string) => 
    `type:${typeValue.toUpperCase()}`);
  
  // Remove quotes from all object keys to make it valid GraphQL syntax
  jsonString = jsonString.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '$1:');
  
  return jsonString;
}
