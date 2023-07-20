import { createHash } from 'crypto'
import { ConversionCustomVariable, PartialErrorResponse, QueryResponse } from './types'
import { ModifiedResponse, RequestClient, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { Features } from '@segment/actions-core/mapping-kit'
import { fullFormats } from 'ajv-formats/dist/formats'

export const API_VERSION = 'v12'
export const CANARY_API_VERSION = 'v13'
export const FLAGON_NAME = 'google-enhanced-canary-version'

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
    `https://googleads.googleapis.com/${getApiVersion(
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

export function getApiVersion(features?: Features, statsContext?: StatsContext): string {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags

  const version = features && features[FLAGON_NAME] ? CANARY_API_VERSION : API_VERSION
  tags?.push(`version:${version}`)
  statsClient?.incr(`google_api_version`, 1, tags)
  return version
}

export const isHashedEmail = (email: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(email)
export const commonHashedEmailValidation = (email: string): string => {
  if (isHashedEmail(email)) {
    return email
  }

  // https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts#L64-L65
  if (!(fullFormats.email as RegExp).test(email)) {
    throw new PayloadValidationError("Email provided doesn't seem to be in a valid format.")
  }

  return String(hash(email))
}
