import { createHash } from 'crypto'
import {
  ConversionCustomVariable,
  PartialErrorResponse,
  QueryResponse,
  ConversionActionId,
  ConversionActionResponse,
  CustomVariableInterface,
  CreateAudienceInput,
  CreateGoogleAudienceResponse,
  UserListResponse,
  UserList
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
import { sha256SmartHash } from '@segment/actions-core'
import { RefreshTokenResponse } from '.'

export const API_VERSION = 'v15'
export const CANARY_API_VERSION = 'v15'
export const FLAGON_NAME = 'google-enhanced-canary-version'

export class GoogleAdsError extends HTTPError {
  response: Response & {
    status: string
    statusText: string
  }
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

export function memoizedGetCustomVariables() {
  const cache: Map<string, Promise<ModifiedResponse<QueryResponse[]>>> = new Map()

  return async (
    customerId: string,
    auth: any,
    request: RequestClient,
    features: Features | undefined,
    statsContext: StatsContext | undefined
  ) => {
    if (cache.has(customerId)) {
      return cache.get(customerId)
    } else {
      const result = getCustomVariables(customerId, auth, request, features, statsContext)
      cache.set(customerId, result)
      return result
    }
  }
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

export async function getListIds(request: RequestClient, settings: CreateAudienceInput['settings'], auth?: any) {
  const json = {
    query: `SELECT user_list.id, user_list.name FROM user_list`
  }

  try {
    const response: ModifiedResponse<UserListResponse> = await request(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${settings.customerId}/googleAds:search`,
      {
        method: 'post',
        headers: {
          'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`,
          authorization: `Bearer ${auth?.accessToken}`
        },
        json
      }
    )

    const choices = response.data.results.map((input: UserList) => {
      return { value: input.userList.id, label: input.userList.name }
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

export async function createGoogleAudience(
  request: RequestClient,
  input: CreateAudienceInput,
  auth: CreateAudienceInput['settings']['oauth'],
  statsContext?: StatsContext
) {
  if (input.audienceSettings.external_id_type === 'MOBILE_ADVERTISING_ID' && !input.audienceSettings.app_id) {
    throw new PayloadValidationError('App ID is required when external ID type is mobile advertising ID.')
  }

  if (
    !auth?.refresh_token ||
    !process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID ||
    !process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET
  ) {
    throw new PayloadValidationError('Oauth credentials missing.')
  }

  const res = await request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: auth.refresh_token,
      client_id: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  })

  const accessToken = res.data.access_token

  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags
  const json = {
    operations: [
      {
        create: {
          crmBasedUserList: {
            uploadKeyType: input.audienceSettings.external_id_type,
            appId: input.audienceSettings.app_id
          },
          membershipLifeSpan: '10000', // In days. 10000 is interpreted as 'unlimited'.
          name: `${input.audienceName}`
        }
      }
    ]
  }

  const response = await request(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${input.settings.customerId}/userLists:mutate`,
    {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`,
        authorization: `Bearer ${accessToken}`
      },
      json
    }
  )

  // Successful response body looks like:
  // {"results": [{ "resourceName": "customers/<customer_id>/userLists/<user_list_id>" }]}
  const name = (response.data as CreateGoogleAudienceResponse).results[0].resourceName
  if (!name) {
    statsClient?.incr('createAudience.error', 1, statsTags)
    throw new IntegrationError('Failed to receive a created customer list id.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('createAudience.success', 1, statsTags)
  return name.split('/')[3]
}

export async function getGoogleAudience(
  request: RequestClient,
  settings: CreateAudienceInput['settings'],
  externalId: string,
  auth: CreateAudienceInput['settings']['oauth'],
  statsContext?: StatsContext
) {
  if (
    !auth?.refresh_token ||
    !process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID ||
    !process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET
  ) {
    throw new PayloadValidationError('Oauth credentials missing.')
  }

  const res = await request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: auth.refresh_token,
      client_id: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  })

  const accessToken = res.data.access_token
  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags
  const json = {
    query: `SELECT user_list.id, user_list.name FROM user_list where user_list.id = '${externalId}'`
  }

  const response = await request(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${settings.customerId}/googleAds:search`,
    {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`,
        authorization: `Bearer ${accessToken}`
      },
      json
    }
  )

  const id = (response.data as any).results[0].userList.id

  if (!id) {
    statsClient?.incr('getAudience.error', 1, statsTags)
    throw new IntegrationError('Failed to receive a customer list.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('getAudience.success', 1, statsTags)
  return response.data as UserListResponse
}

const formatEmail = (email: string): string => {
  const googleDomain = new RegExp('^(gmail|googlemail).s*', 'g')
  let normalizedEmail = email.toLowerCase().trim()
  const emailParts = normalizedEmail.split('@')
  if (emailParts.length > 1 && emailParts[1].match(googleDomain)) {
    emailParts[0] = emailParts[0].replace('.', '')
    normalizedEmail = `${emailParts[0]}@${emailParts[1]}`
  }

  return sha256SmartHash(normalizedEmail)
}

// Standardize phone number to E.164 format, This format represents a phone number as a number up to fifteen digits
// in length starting with a + sign, for example, +12125650000 or +442070313000.
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

const formatPhone = (phone: string): string => {
  const formattedPhone = formatToE164(phone, '1')
  return sha256SmartHash(formattedPhone)
}

const extractUserIdentifiers = (payloads: UserListPayload[], idType: string, syncMode?: string) => {
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
          hashedEmail: formatEmail(payload.email)
        })
      }
      if (payload.phone) {
        identifiers.push({
          hashedPhoneNumber: formatPhone(payload.phone)
        })
      }
      if (payload.first_name || payload.last_name || payload.country_code || payload.postal_code) {
        identifiers.push({
          addressInfo: {
            hashedFirstName: sha256SmartHash(payload.first_name ?? ''),
            hashedLastName: sha256SmartHash(payload.last_name ?? ''),
            countryCode: payload.country_code ?? '',
            postalCode: payload.postal_code ?? ''
          }
        })
      }
      return identifiers
    }
  }
  // Map user data to Google Ads API format
  for (const payload of payloads) {
    if (payload.event_name == 'Audience Entered' || syncMode == 'add') {
      addUserIdentifiers.push({ create: { userIdentifiers: identifierFunctions[idType](payload) } })
    } else if (payload.event_name == 'Audience Exited' || syncMode == 'delete') {
      removeUserIdentifiers.push({ remove: { userIdentifiers: identifierFunctions[idType](payload) } })
    }
  }
  return [addUserIdentifiers, removeUserIdentifiers]
}

const createOfflineUserJob = async (
  request: RequestClient,
  payload: UserListPayload,
  settings: CreateAudienceInput['settings'],
  hookListId?: string,
  statsContext?: StatsContext | undefined
) => {
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${settings.customerId}/offlineUserDataJobs:create`

  let external_audience_id = payload.external_audience_id
  if (hookListId) {
    external_audience_id = hookListId
  }

  const json = {
    job: {
      type: 'CUSTOMER_MATCH_USER_LIST',
      customerMatchUserListMetadata: {
        userList: `customers/${settings.customerId}/userLists/${external_audience_id}`,
        consent: {
          adUserData: payload.ad_user_data_consent_state,
          adPersonalization: payload.ad_personalization_consent_state
        }
      }
    }
  }

  try {
    const response = await request(url, {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
      },
      json
    })
    return (response.data as any).resourceName
  } catch (error) {
    statsContext?.statsClient?.incr('error.createJob', 1, statsContext?.tags)
    console.log(error)
    throw new IntegrationError(
      (error as GoogleAdsError).response?.statusText,
      'INVALID_RESPONSE',
      (error as GoogleAdsError).response?.status
    )
  }
}

const addOperations = async (
  request: RequestClient,
  userIdentifiers: any,
  resourceName: string,
  statsContext: StatsContext | undefined
) => {
  const url = `https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`

  const json = {
    operations: userIdentifiers,
    enable_warnings: true
  }

  try {
    const response = await request(url, {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
      },
      json
    })

    return response.data
  } catch (error) {
    statsContext?.statsClient?.incr('error.addOperations', 1, statsContext?.tags)
    throw new IntegrationError(
      (error as GoogleAdsError).response?.statusText,
      'INVALID_RESPONSE',
      (error as GoogleAdsError).response?.status
    )
  }
}

const runOfflineUserJob = async (
  request: RequestClient,
  resourceName: string,
  statsContext: StatsContext | undefined
) => {
  const url = `https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`

  try {
    const response = await request(url, {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
      }
    })

    return response.data
  } catch (error) {
    statsContext?.statsClient?.incr('error.runJob', 1, statsContext?.tags)
    throw new IntegrationError(
      (error as GoogleAdsError).response?.statusText,
      'INVALID_RESPONSE',
      (error as GoogleAdsError).response?.status
    )
  }
}

export const handleUpdate = async (
  request: RequestClient,
  settings: CreateAudienceInput['settings'],
  audienceSettings: CreateAudienceInput['audienceSettings'],
  payloads: UserListPayload[],
  hookListId: string,
  hookListType: string,
  syncMode?: string,
  statsContext?: StatsContext
) => {
  const id_type = hookListType ?? audienceSettings.external_id_type
  // Format the user data for Google Ads API
  const [adduserIdentifiers, removeUserIdentifiers] = extractUserIdentifiers(payloads, id_type, syncMode)

  // Create an offline user data job
  const resourceName = await createOfflineUserJob(request, payloads[0], settings, hookListId, statsContext)

  // Add operations to the offline user data job
  if (adduserIdentifiers.length > 0) {
    await addOperations(request, adduserIdentifiers, resourceName, statsContext)
  }

  if (removeUserIdentifiers.length > 0) {
    await addOperations(request, removeUserIdentifiers, resourceName, statsContext)
  }

  // Run the offline user data job
  const executedJob = await runOfflineUserJob(request, resourceName, statsContext)

  statsContext?.statsClient?.incr('success.offlineUpdateAudience', 1, statsContext?.tags)

  return executedJob
}

/* Enforcing this here since Customer ID is required for the Google Ads API
  but not for the Enhanced Conversions API. */
export const verifyCustomerId = (customerId: string | undefined) => {
  if (!customerId) {
    throw new PayloadValidationError('Customer ID is required.')
  }
  return customerId.replace(/-/g, '')
}
