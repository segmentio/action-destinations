import { createHash } from 'crypto'
import { ConversionCustomVariable, PartialErrorResponse, QueryResponse } from './types'
import { ModifiedResponse, RequestClient, IntegrationError } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/src/destination-kit'
import { Features } from '@segment/actions-core/src/mapping-kit'

export const API_VERSION = 'v12'
const CANARY_API_VERSION = 'v13'
const FLAGON_NAME = 'google-enhanced-canary-version'

export function formatCustomVariables(
  customVariables: object,
  customVariableIdsResults: Array<ConversionCustomVariable>
): object {
  // Maps custom variable keys to their resource names
  const resourceNames: { [key: string]: any } = {}
  Object.entries(customVariableIdsResults).forEach(([_, customVariablesIds]) => {
    resourceNames[customVariablesIds.conversionCustomVariable.name] =
      customVariablesIds.conversionCustomVariable.resourceName
  })

  const variables: { conversionCustomVariable: string; value: string }[] = []
  Object.entries(customVariables).forEach(([key, value]) => {
    if (resourceNames[key] != undefined) {
      const variable = {
        conversionCustomVariable: resourceNames[key],
        value: value
      }
      variables.push(variable)
    }
  })

  return variables
}

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return
  }

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export async function getCustomVariables(
  customerId: string,
  auth: any,
  request: RequestClient,
  features: Features | undefined,
  statsContext: StatsContext | undefined
): Promise<ModifiedResponse<QueryResponse[]>> {
  return await request(
    `https://googleads.googleapis.com/${get_api_version(
      features,
      statsContext
    )}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'post',
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
      },
      json: {
        query: `SELECT conversion_custom_variable.id, conversion_custom_variable.name FROM conversion_custom_variable`
      }
    }
  )
}

/* Ensures there is no error when using Google's partialFailure mode
   See here: https://developers.google.com/google-ads/api/docs/best-practices/partial-failures
 */
export function handleGoogleErrors(response: ModifiedResponse<PartialErrorResponse>) {
  if (response.data.partialFailureError) {
    throw new IntegrationError(response.data.partialFailureError.message, 'INVALID_ARGUMENT', 400)
  }
}

export function convertTimestamp(timestamp: string | undefined): string | undefined {
  if (!timestamp) {
    return undefined
  }
  return timestamp.replace(/T/, ' ').replace(/\..+/, '+00:00')
}

export function get_api_version(features: Features | undefined, statsContext: StatsContext | undefined): string {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags

  if (features && features[FLAGON_NAME]) {
    tags?.push(`version:${CANARY_API_VERSION}`)
    statsClient?.incr(`google_api_version`, 1, tags)
    return CANARY_API_VERSION
  }

  tags?.push(`version:${API_VERSION}`)
  statsClient?.incr(`google_api_version`, 1, tags)
  return API_VERSION
}
