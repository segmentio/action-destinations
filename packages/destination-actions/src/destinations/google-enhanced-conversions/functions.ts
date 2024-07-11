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
import type { Payload as UserListPayload } from './userList/generated-types'
import * as crypto from 'crypto'

export const API_VERSION = 'v16'
export const CANARY_API_VERSION = 'v16'
export const FLAGON_NAME = 'google-enhanced-canary-version'

export interface AudienceSettings {
  external_id_type: string
}
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

  const response = await request(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${input.settings.customerId}:mutate`,
    {
      method: 'post',
      json
    }
  )

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
    `https://googleads.googleapis.com/${API_VERSION}/customers/${settings.customerId}/googleAds:search`,
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

const formatEmail = (email: string, hash_data?: boolean): string => {
  if (!hash_data) {
    return email
  }
  const googleDomain = new RegExp('^(gmail|googlemail).s*', 'g')
  let normalizedEmail = email.toLowerCase().trim()
  const emailParts = normalizedEmail.split('@')
  if (emailParts.length > 1 && emailParts[1].match(googleDomain)) {
    emailParts[0] = emailParts[0].replace('.', '')
    normalizedEmail = `${emailParts[0]}@${emailParts[1]}`
  }

  return crypto.createHash('sha256').update(normalizedEmail).digest('hex')
}

function formatToE164(phoneNumber: string, defaultCountryCode: string): string {
  // Remove any non-numeric characters
  const numericPhoneNumber = phoneNumber.replace(/\D/g, '')

  // Check if the phone number starts with the country code
  let formattedPhoneNumber = numericPhoneNumber
  if (!numericPhoneNumber.startsWith(defaultCountryCode)) {
    formattedPhoneNumber = defaultCountryCode + numericPhoneNumber
  }

  // Ensure the formatted phone number starts with '+'
  if (!formattedPhoneNumber.startsWith('+')) {
    formattedPhoneNumber = '+' + formattedPhoneNumber
  }

  return formattedPhoneNumber
}

const formatPhone = (phone: string, hash_data?: boolean): string => {
  if (!hash_data) {
    return phone
  }
  const formattedPhone = formatToE164(phone, '1')
  return crypto.createHash('sha256').update(formattedPhone).digest('hex')
}

const extractUserIdentifiers = (payloads: UserListPayload[], audienceSettings: AudienceSettings) => {
  const removeUserIdentifiers = []
  const addUserIdentifiers = []

  // Map user data to Google Ads API format
  const identifierFunctions: { [key: string]: (payload: UserListPayload) => any } = {
    MOBILE_ADVERTISING_ID: (payload: UserListPayload) => ({
      mobileId: payload.mobile_advertising_id?.trim()
    }),
    CRM_ID: (payload: UserListPayload) => ({
      thirdPartyUserId: payload.crm_id?.trim()
    }),
    CONTACT_INFO: (payload: UserListPayload) => {
      const identifiers = []
      if (payload.email) {
        identifiers.push({
          hashedEmail: formatEmail(payload.email, payload.hash_data)
        })
      }
      if (payload.phone) {
        identifiers.push({
          hashedPhoneNumber: formatPhone(payload.phone, payload.hash_data)
        })
      }
      return identifiers
    }
  }

  // Map user data to Google Ads API format
  for (const payload of payloads) {
    if (payload.event_name == 'Audience Entered') {
      addUserIdentifiers.push(identifierFunctions[audienceSettings.external_id_type](payload))
    } else if (payload.event_name == 'Audience Exited') {
      removeUserIdentifiers.push(identifierFunctions[audienceSettings.external_id_type](payload))
    }
  }
  return [{ remove: { userIdentifiers: removeUserIdentifiers } }, { add: { userIdentifiers: addUserIdentifiers } }]
}

const createOfflineUserJob = async (request: RequestClient, payload: UserListPayload, settings: any) => {
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${settings.customerId}/offlineUserDataJobs:create`

  const json = {
    job: {
      type: 'CUSTOMER_MATCH_USER_LIST',
      customerMatchUserListMetadata: {
        userList: `customers/${settings.customerId}/userLists/${payload.external_audience_id}`
      }
    }
  }

  const response = await request(url, {
    method: 'post',
    json
  })

  return (response.data as any).results[0].resourceName
}

const addOperations = async (request: RequestClient, userIdentifiers: any, resourceName: string) => {
  const url = `https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`

  const json = {
    operations: userIdentifiers,
    enable_warnings: true
  }

  const response = await request(url, {
    method: 'post',
    json
  })

  return response.data
}

const runOfflineUserJob = async (request: RequestClient, resourceName: string) => {
  const url = `https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`

  const response = await request(url, {
    method: 'post'
  })

  return response.data
}

export const handleUpdate = async (
  request: RequestClient,
  settings: any,
  audienceSettings: any,
  payloads: UserListPayload[],
  statsContext: StatsContext | undefined
) => {
  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags

  // Format the user data for Google Ads API
  const userIdentifiers = extractUserIdentifiers(payloads, audienceSettings)

  // Create an offline user data job

  const resourceName = await createOfflineUserJob(request, payloads[0], settings)

  // Add operations to the offline user data job

  await addOperations(request, userIdentifiers, resourceName)

  // Run the offline user data job

  const executedJob = await runOfflineUserJob(request, resourceName)

  statsClient?.incr('success.offlineUpdateAudience', 1, statsTags)

  return executedJob
}
