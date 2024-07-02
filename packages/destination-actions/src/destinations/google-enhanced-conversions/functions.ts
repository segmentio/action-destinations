import { createHash } from 'crypto'
import {
  ConversionCustomVariable,
  PartialErrorResponse,
  QueryResponse,
  ConversionActionId,
  ConversionActionResponse,
  CustomVariableInterface
} from './types'
import {
  ModifiedResponse,
  RequestClient,
  IntegrationError,
  PayloadValidationError,
  DynamicFieldResponse
} from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { Features } from '@segment/actions-core/mapping-kit'
import { fullFormats } from 'ajv-formats/dist/formats'
import { HTTPError } from '@segment/actions-core'

export const API_VERSION = 'v15'
export const CANARY_API_VERSION = 'v15'
export const FLAGON_NAME = 'google-enhanced-canary-version'

export class GoogleAdsError extends HTTPError {
  response: Response & {
    status: string
    statusText: string
  }
}

export interface CreateAudienceInput {
  audienceName: string
  settings: {
    customerId?: string
    conversionTrackingId?: string
  }
  audienceSettings?: unknown
}

export function formatCustomVariables(
  customVariables: object,
  customVariableIdsResults: Array<ConversionCustomVariable>
): CustomVariableInterface[] {
  // Maps custom variable keys to their resource names
  const resourceNames: { [key: string]: string } = {}
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

export async function getConversionActionId(
  customerId: string | undefined,
  auth: any,
  request: RequestClient,
  features: Features | undefined,
  statsContext: StatsContext | undefined
): Promise<ModifiedResponse<QueryResponse[]>> {
  return request(
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
        query: `SELECT conversion_action.id, conversion_action.name FROM conversion_action`
      }
    }
  )
}

export async function getConversionActionDynamicData(
  request: RequestClient,
  settings: any,
  auth: any,
  features: Features | undefined,
  statsContext: StatsContext | undefined
): Promise<DynamicFieldResponse> {
  try {
    // remove '-' from CustomerId
    settings.customerId = settings.customerId.replace(/-/g, '')
    const results = await getConversionActionId(settings.customerId, auth, request, features, statsContext)

    const res: Array<ConversionActionResponse> = JSON.parse(results.content)
    const choices = res[0].results.map((input: ConversionActionId) => {
      return { value: input.conversionAction.id, label: input.conversionAction.name }
    })
    return {
      choices
    }
  } catch (err) {
    return {
      choices: [],
      nextPage: '',
      error: {
        message: (err as GoogleAdsError).response?.statusText ?? 'Unknown error',
        code: (err as GoogleAdsError).response?.status + '' ?? '500'
      }
    }
  }
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

export const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)
export const commonHashedEmailValidation = (email: string): string => {
  if (isHashedInformation(email)) {
    return email
  }

  // https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts#L64-L65
  if (!(fullFormats.email as RegExp).test(email)) {
    throw new PayloadValidationError("Email provided doesn't seem to be in a valid format.")
  }

  return String(hash(email))
}

export async function createGoogleAudience(
  request: RequestClient,
  input: CreateAudienceInput,
  statsContext?: StatsContext
) {
  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags
  const json = {
    operations: [
      {
        create: {
          crmBasedUserList: {
            uploadKeyType: (input.audienceSettings as { external_id_type: string }).external_id_type
          },
          membershipLifeSpan: '10000', // In days. 10000 is interpreted as 'unlimited'.
          name: `${input.audienceName}`
        }
      }
    ]
  }

  const response = await request(`https://googleads.googleapis.com/v16/customers/${input.settings.customerId}:mutate`, {
    method: 'post',
    json
  })

  // Successful response body looks like:
  // {"results": [{ "resourceName": "customers/<customer_id>/userLists/<user_list_id>" }]}
  const name = (response.data as any).results[0].resourceName
  if (!name) {
    statsClient?.incr('createAudience.error', 1, statsTags)
    throw new IntegrationError('Failed to receive a created customer list id.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('createAudience.success', 1, statsTags)
  return name.split('/')[3]
}

export async function getGoogleAudience(
  request: RequestClient,
  settings: any,
  externalId: string,
  statsContext?: StatsContext
) {
  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags
  const json = {
    query: `SELECT user_list.id, user_list.name FROM user_list where user_list.id = '${externalId}'`
  }

  const response = await request(
    `https://googleads.googleapis.com/v16/customers/${settings.customerId}/googleAds:search`,
    {
      method: 'post',
      json
    }
  )

  const id = (response.data as any).results[0].userList.id

  if (!id) {
    statsClient?.incr('getAudience.error', 1, statsTags)
    throw new IntegrationError('Failed to receive a customer list.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('getAudience.success', 1, statsTags)
  return id
}
