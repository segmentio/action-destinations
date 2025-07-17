// eslint-disable-next-line no-restricted-syntax
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
  UserList,
  OfflineUserJobPayload,
  AddOperationPayload
} from './types'
import {
  ModifiedResponse,
  RequestClient,
  IntegrationError,
  RetryableError,
  PayloadValidationError,
  DynamicFieldResponse,
  Features,
  MultiStatusResponse,
  JSONLikeObject,
  ErrorCodes
} from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { fullFormats } from 'ajv-formats/dist/formats'
import { HTTPError } from '@segment/actions-core'
import type { Payload as UserListPayload } from './userList/generated-types'
import { RefreshTokenResponse } from '.'
import { STATUS_CODE_MAPPING } from './constants'
import { processHashing } from '../../lib/hashing-utils'
export const API_VERSION = 'v17'
export const CANARY_API_VERSION = 'v19'
export const FLAGON_NAME = 'google-enhanced-canary-version'

type GoogleAdsErrorData = {
  error: {
    code: number
    details: [
      {
        '@type': string
        errors: [
          {
            errorCode: { databaseError: string }
            message: string
          }
        ]
      }
    ]
    message: string
    status: string
  }
}
export class GoogleAdsError extends HTTPError {
  response: Response & {
    status: string
    statusText: string
    data: GoogleAdsErrorData
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
  return timestamp.replace(/T/, ' ').replace(/(\.\d+)?Z/, '+00:00')
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
export const commonEmailValidation = (email: string): string => {
  // https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts#L64-L65
  const googleDomain = new RegExp('^(gmail|googlemail).s*', 'g')
  let normalizedEmail = email.toLowerCase().trim()
  const emailParts = normalizedEmail.split('@')
  if (emailParts.length > 1 && emailParts[1].match(googleDomain)) {
    emailParts[0] = emailParts[0].replace('.', '')
    normalizedEmail = `${emailParts[0]}@${emailParts[1]}`
  }
  if (!(fullFormats.email as RegExp).test(normalizedEmail)) {
    throw new PayloadValidationError("Email provided doesn't seem to be in a valid format.")
  }

  return normalizedEmail
}

export async function getListIds(
  request: RequestClient,
  settings: CreateAudienceInput['settings'],
  auth?: any,
  features?: Features | undefined,
  statsContext?: StatsContext
) {
  const json = {
    query: `SELECT user_list.id, user_list.name FROM user_list`
  }

  try {
    const response: ModifiedResponse<UserListResponse> = await request(
      `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
        settings.customerId
      }/googleAds:search`,
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
  features?: Features | undefined,
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
          membershipLifeSpan: '540',
          name: `${input.audienceName}`
        }
      }
    ]
  }

  const response = await request(
    `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
      input.settings.customerId
    }/userLists:mutate`,
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
  features?: Features | undefined,
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
    `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
      settings.customerId
    }/googleAds:search`,
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

// Standardize phone number to E.164 format, This format represents a phone number as a number up to fifteen digits
// in length starting with a + sign, for example, +12125650000 or +442070313000.
// exported for unit testing
export function formatToE164(phoneNumber: string, countryCode: string): string {
  // Remove any non-numeric characters
  const numericPhoneNumber = phoneNumber.replace(/\D/g, '')

  // Check if the phone number starts with the country code
  let formattedPhoneNumber = numericPhoneNumber
  const formattedCountryCode = countryCode.replace(/\D/g, '')
  if (!numericPhoneNumber.startsWith(formattedCountryCode)) {
    formattedPhoneNumber = formattedCountryCode + numericPhoneNumber
  }

  // Ensure the formatted phone number starts with '+'
  if (!formattedPhoneNumber.startsWith('+')) {
    formattedPhoneNumber = '+' + formattedPhoneNumber
  }
  return formattedPhoneNumber
}

export const formatPhone = (phone: string, countryCode?: string): string => {
  // Check if phone number is already hashed before doing any formatting
  if (isHashedInformation(phone)) {
    return phone
  }
  const formattedPhone = formatToE164(phone, countryCode ?? '+1')
  return formattedPhone
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
          hashedEmail: processHashing(payload.email, 'sha256', 'hex', commonEmailValidation)
        })
      }
      if (payload.phone) {
        identifiers.push({
          hashedPhoneNumber: processHashing(payload.phone, 'sha256', 'hex', (value) =>
            formatPhone(value, payload.phone_country_code)
          )
        })
      }
      if (payload.first_name || payload.last_name || payload.country_code || payload.postal_code) {
        const addressInfo: any = {}
        if (payload.first_name) {
          addressInfo.hashedFirstName = processHashing(payload.first_name, 'sha256', 'hex')
        }
        if (payload.last_name) {
          addressInfo.hashedLastName = processHashing(payload.last_name, 'sha256', 'hex')
        }
        addressInfo.countryCode = payload.country_code ?? ''
        addressInfo.postalCode = payload.postal_code ?? ''
        identifiers.push({ addressInfo })
      }
      return identifiers
    }
  }
  // Map user data to Google Ads API format
  for (const payload of payloads) {
    if (
      payload.event_name === 'Audience Entered' ||
      syncMode === 'add' ||
      (syncMode === 'mirror' && payload.event_name === 'new')
    ) {
      addUserIdentifiers.push({ create: { userIdentifiers: identifierFunctions[idType](payload) } })
    } else if (
      payload.event_name === 'Audience Exited' ||
      syncMode === 'delete' ||
      (syncMode === 'mirror' && payload.event_name === 'deleted')
    ) {
      removeUserIdentifiers.push({ remove: { userIdentifiers: identifierFunctions[idType](payload) } })
    }
  }
  return [addUserIdentifiers, removeUserIdentifiers]
}

const createOfflineUserJob = async (
  request: RequestClient,
  offlineUserJobPayload: OfflineUserJobPayload,
  settings: CreateAudienceInput['settings'],
  features?: Features | undefined,
  statsContext?: StatsContext | undefined
) => {
  const url = `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/customers/${
    settings.customerId
  }/offlineUserDataJobs:create`

  try {
    const response = await request(url, {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
      },
      json: offlineUserJobPayload
    })
    return { success: true, data: (response.data as any).resourceName }
  } catch (error) {
    statsContext?.statsClient?.incr('error.createJob', 1, statsContext?.tags)
    return { success: false, error }
  }
}

const handleGoogleAdsError = (error: any) => {
  // Google throws 400 error for CONCURRENT_MODIFICATION error which is a retryable error
  // We rewrite this error to a 500 so that Centrifuge can retry the request
  const errors = (error as GoogleAdsError)?.response?.data?.error?.details ?? []
  for (const errorDetails of errors) {
    for (const errorItem of errorDetails.errors) {
      // https://developers.google.com/google-ads/api/reference/rpc/v19/DatabaseErrorEnum.DatabaseError
      if (errorItem?.errorCode?.databaseError === 'CONCURRENT_MODIFICATION') {
        throw new RetryableError(
          errorItem?.message ??
            'Multiple requests were attempting to modify the same resource at once. Retry the request.',
          500
        )
      }
    }
  }

  throw error
}
const addOperations = async (
  request: RequestClient,
  addOperationPayload: AddOperationPayload,
  resourceName: string,
  features?: Features,
  statsContext?: StatsContext
) => {
  const url = `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/${resourceName}:addOperations`

  try {
    const response = await request(url, {
      method: 'post',
      headers: { 'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}` },
      json: addOperationPayload
    })
    return { success: true, data: response.data }
  } catch (error) {
    statsContext?.statsClient?.incr('error.addOperations', 1, statsContext?.tags)
    return { success: false, error }
  }
}

const processOperations = async (
  request: RequestClient,
  userIdentifiers: any,
  resourceName: string,
  validPayloadIndicesBitmap: number[],
  failedPayloadIndices: Set<number>,
  multiStatusResponse: MultiStatusResponse,
  features?: Features | undefined,
  statsContext?: StatsContext | undefined
) => {
  const operationPayload = { operations: userIdentifiers, enablePartialFailure: true }
  const { success, data, error } = await addOperations(request, operationPayload, resourceName, features, statsContext)
  if (!success) {
    handleGoogleAdsAPIErrorResponse(
      error as GoogleAdsError,
      validPayloadIndicesBitmap,
      multiStatusResponse,
      operationPayload,
      failedPayloadIndices
    )
  }
  const partialFailureError = (data as any)?.partialFailureError

  if (partialFailureError) {
    handlePartialFailureResponse(
      partialFailureError,
      validPayloadIndicesBitmap,
      multiStatusResponse,
      userIdentifiers,
      failedPayloadIndices
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
  features?: Features | undefined,
  statsContext?: StatsContext
) => {
  const externalAudienceId: string | undefined = hookListId || payloads[0]?.external_audience_id
  if (!externalAudienceId) {
    throw new PayloadValidationError('External Audience ID is required.')
  }
  const id_type = hookListType ?? audienceSettings.external_id_type
  // Format the user data for Google Ads API
  const [adduserIdentifiers, removeUserIdentifiers] = extractUserIdentifiers(payloads, id_type, syncMode)
  const offlineUserJobPayload = createOfflineUserJobPayload(externalAudienceId, payloads[0], settings.customerId)
  // Create an offline user data job
  const offlineUserJobResponse = await createOfflineUserJob(
    request,
    offlineUserJobPayload,
    settings,
    features,
    statsContext
  )
  if (!offlineUserJobResponse.success) {
    return handleGoogleAdsError(offlineUserJobResponse.error)
  }
  const resourceName = offlineUserJobResponse.data
  // Add operations to the offline user data job
  if (adduserIdentifiers.length > 0) {
    const addOperationPayload = { operations: adduserIdentifiers, enable_warnings: true }
    const addResponse = await addOperations(request, addOperationPayload, resourceName, features, statsContext)
    if (!addResponse.success) {
      return handleGoogleAdsError(addResponse.error)
    }
  }

  if (removeUserIdentifiers.length > 0) {
    const removeOperationPayload = { operations: removeUserIdentifiers, enable_warnings: true }
    const removeResponse = await addOperations(request, removeOperationPayload, resourceName, features, statsContext)
    if (!removeResponse.success) {
      return handleGoogleAdsError(removeResponse.error)
    }
  }

  // Run the offline user data job
  const executedJob = await runOfflineUserJob(request, resourceName, features, statsContext)
  if (!executedJob.success) {
    return handleGoogleAdsError(executedJob.error)
  }

  statsContext?.statsClient?.incr('success.offlineUpdateAudience', 1, statsContext?.tags)

  return executedJob.data
}

/* Enforcing this here since Customer ID is required for the Google Ads API
  but not for the Enhanced Conversions API. */
export const verifyCustomerId = (customerId: string | undefined) => {
  if (!customerId) {
    throw new PayloadValidationError('Customer ID is required.')
  }
  return customerId.replace(/-/g, '')
}

const handleGoogleAdsAPIErrorResponse = (
  error: any,
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  payload: JSONLikeObject,
  failedPayloadIndices?: Set<number>
) => {
  const errorData = error?.response?.data?.error
  const parsedError = parseGoogleAdsError(errorData)
  validPayloadIndicesBitmap.forEach((index) => {
    multiStatusResponse.setErrorResponseAtIndex(index, {
      ...parsedError,
      body: error,
      sent: payload
    })
    failedPayloadIndices?.add(index)
  })
}

const parseGoogleAdsError = (error: any) => {
  // Google throws 400 error for CONCURRENT_MODIFICATION error which is a retryable error
  // We mark  this error to a 429 so that Centrifuge can retry the request.

  const hasConcurrentModificationError = error?.details?.some((detail: any) => {
    return detail?.errors?.some((e: any) => e?.errorCode?.databaseError === 'CONCURRENT_MODIFICATION')
  })

  return hasConcurrentModificationError
    ? {
        errormessage:
          "This event wasn't delivered because of CONCURRENT_MODIFICATION error. Multiple requests were attempting to modify the same resource at once. Retry the request.",
        errortype: 'RETRYABLE_BATCH_FAILURE' as keyof typeof ErrorCodes,
        status: 429
      }
    : {
        errormessage: error?.message,
        status: error?.code
      }
}

const updateMultiStatusResponseWithSuccess = (
  executedJob: JSONLikeObject,
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  sentBody: JSONLikeObject | string,
  failedPayloadIndices: Set<number>
) => {
  validPayloadIndicesBitmap.forEach((index) => {
    if (!failedPayloadIndices.has(index)) {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: sentBody,
        body: executedJob.data as JSONLikeObject
      })
    }
  })
}

export const handlePartialFailureResponse = (
  partialFailureError: any,
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  userIdentifiers: any[],
  failedPayloadIndices: Set<number>
) => {
  partialFailureError?.details?.forEach((detail: any) => {
    detail.errors?.forEach((error: any) => {
      const failedIndex = error.location?.fieldPathElements?.find(
        (field: any) => field.fieldName === 'operations'
      )?.index

      if (failedIndex >= 0) {
        const originalIndex = validPayloadIndicesBitmap[failedIndex]
        multiStatusResponse.setErrorResponseAtIndex(originalIndex, {
          status: STATUS_CODE_MAPPING?.[partialFailureError.code as keyof typeof STATUS_CODE_MAPPING]?.status ?? 500, // error code
          errormessage: error.message,
          sent: userIdentifiers?.[failedIndex],
          body: error
        })
        failedPayloadIndices.add(originalIndex)
      }
    })
  })
}
const runOfflineUserJob = async (
  request: RequestClient,
  resourceName: string,
  features?: Features | undefined,
  statsContext?: StatsContext | undefined
) => {
  const url = `https://googleads.googleapis.com/${getApiVersion(features, statsContext)}/${resourceName}:run`

  try {
    const response = await request(url, {
      method: 'post',
      headers: {
        'developer-token': `${process.env.ADWORDS_DEVELOPER_TOKEN}`
      }
    })
    return { success: true, data: response.data }
  } catch (error) {
    statsContext?.statsClient?.incr('error.runJob', 1, statsContext?.tags)
    return { success: false, error }
  }
}

export const createIdentifierExtractors = () => ({
  MOBILE_ADVERTISING_ID: (payload: UserListPayload) => {
    return payload.mobile_advertising_id?.trim() ? { mobileId: payload.mobile_advertising_id.trim() } : null
  },

  CRM_ID: (payload: UserListPayload) => {
    return payload.crm_id?.trim() ? { thirdPartyUserId: payload.crm_id.trim() } : null
  },

  CONTACT_INFO: (payload: UserListPayload) => {
    const identifiers = []

    if (payload.email) {
      identifiers.push({
        hashedEmail: processHashing(payload.email, 'sha256', 'hex', commonEmailValidation)
      })
    }

    if (payload.phone) {
      identifiers.push({
        hashedPhoneNumber: processHashing(payload.phone, 'sha256', 'hex', (value) =>
          formatPhone(value, payload.phone_country_code)
        )
      })
    }

    if (payload.first_name || payload.last_name || payload.country_code || payload.postal_code) {
      identifiers.push({
        addressInfo: {
          hashedFirstName: payload.first_name ? processHashing(payload.first_name, 'sha256', 'hex') : undefined,
          hashedLastName: payload.last_name ? processHashing(payload.last_name, 'sha256', 'hex') : undefined,
          countryCode: payload.country_code || '',
          postalCode: payload.postal_code || ''
        }
      })
    }

    return identifiers.length > 0 ? identifiers : null
  }
})

const extractBatchUserIdentifiers = (
  payloads: UserListPayload[],
  idType: string,
  multiStatusResponse: MultiStatusResponse,
  syncMode?: string
) => {
  const removeUserIdentifiers: any[] = []
  const addUserIdentifiers: any[] = []
  const validPayloadIndicesBitmap: number[] = []

  //Identify the user identifiers based on the idType
  const extractors = createIdentifierExtractors()

  payloads.forEach((payload, index) => {
    let userIdentifiers
    try {
      userIdentifiers = extractors[idType as keyof typeof extractors]?.(payload)
    } catch (error) {
      if (error instanceof PayloadValidationError) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error.message
        })
      }
      return
    }
    if (!userIdentifiers) {
      multiStatusResponse?.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: `Missing or Invalid data for ${idType}.`
      })
      return
    }
    const operationType = determineOperationType(payload, syncMode)
    if (!operationType) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Could not determine Operation Type.'
      })
      return
    }

    validPayloadIndicesBitmap.push(index)
    if (operationType === 'add') {
      addUserIdentifiers.push({ create: { userIdentifiers } })
    } else {
      removeUserIdentifiers.push({ remove: { userIdentifiers } })
    }
  })

  return { addUserIdentifiers, removeUserIdentifiers, validPayloadIndicesBitmap }
}

// Helper function to determine operation type
const determineOperationType = (payload: UserListPayload, syncMode?: string) => {
  if (
    payload.event_name === 'Audience Entered' ||
    syncMode === 'add' ||
    (syncMode === 'mirror' && payload.event_name === 'new')
  ) {
    return 'add'
  } else if (
    payload.event_name === 'Audience Exited' ||
    syncMode === 'delete' ||
    (syncMode === 'mirror' && payload.event_name === 'deleted')
  ) {
    return 'remove'
  }

  return null
}

const createOfflineUserJobPayload = (audienceId: string, payload: UserListPayload, customerId?: string) => ({
  job: {
    type: 'CUSTOMER_MATCH_USER_LIST',
    customerMatchUserListMetadata: {
      userList: `customers/${customerId}/userLists/${audienceId}`,
      consent: {
        adUserData: payload?.ad_user_data_consent_state,
        adPersonalization: payload?.ad_personalization_consent_state
      }
    }
  }
})

export const processBatchPayload = async (
  request: RequestClient,
  settings: CreateAudienceInput['settings'],
  audienceSettings: CreateAudienceInput['audienceSettings'],
  payloads: UserListPayload[],
  hookListId: string,
  hookListType: string,
  syncMode?: string,
  features?: Features | undefined,
  statsContext?: StatsContext
) => {
  const externalAudienceId = hookListId || payloads[0]?.external_audience_id
  if (!externalAudienceId) {
    throw new PayloadValidationError('External Audience ID is required.')
  }
  const multiStatusResponse = new MultiStatusResponse()
  const id_type = hookListType ?? audienceSettings.external_id_type
  // Extract user identifiers and validPayloadIndicesBitmap from payloads
  const { addUserIdentifiers, removeUserIdentifiers, validPayloadIndicesBitmap } = extractBatchUserIdentifiers(
    payloads,
    id_type,
    multiStatusResponse,
    syncMode
  )
  // Create offline user data job payload
  const offlineUserJobPayload = createOfflineUserJobPayload(externalAudienceId, payloads[0], settings.customerId)
  // Step1 :- Create an Offline user data job
  const {
    success,
    data: resourceName,
    error
  } = await createOfflineUserJob(request, offlineUserJobPayload, settings, features, statsContext)
  if (!success) {
    handleGoogleAdsAPIErrorResponse(
      error as GoogleAdsError,
      validPayloadIndicesBitmap,
      multiStatusResponse,
      offlineUserJobPayload
    )
    return multiStatusResponse
  }
  const failedPayloadIndices: Set<number> = new Set()
  // Step 2:- Add operations to the Offline user data job
  if (addUserIdentifiers.length > 0) {
    await processOperations(
      request,
      addUserIdentifiers,
      resourceName,
      validPayloadIndicesBitmap,
      failedPayloadIndices,
      multiStatusResponse,
      features,
      statsContext
    )
  }

  if (removeUserIdentifiers.length > 0) {
    await processOperations(
      request,
      removeUserIdentifiers,
      resourceName,
      validPayloadIndicesBitmap,
      failedPayloadIndices,
      multiStatusResponse,
      features,
      statsContext
    )
  }
  if (failedPayloadIndices.size === validPayloadIndicesBitmap.length) {
    return multiStatusResponse // Return multi-status response if all operations failed
  }

  //Step 3:- Run the offline user data job
  const executedJob: any = await runOfflineUserJob(request, resourceName, features, statsContext)
  statsContext?.statsClient?.incr('success.offlineUpdateAudience', 1, statsContext?.tags)

  const sentBody = `/${resourceName}:run`
  if (!executedJob.success) {
    handleJobExecutionError(executedJob, validPayloadIndicesBitmap, multiStatusResponse, sentBody, failedPayloadIndices)
  } else {
    updateMultiStatusResponseWithSuccess(
      executedJob,
      validPayloadIndicesBitmap,
      multiStatusResponse,
      sentBody,
      failedPayloadIndices
    )
  }
  return multiStatusResponse
}

export const handleJobExecutionError = (
  executedJob: any,
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  sentBody: string,
  failedPayloadIndices: Set<number>
) => {
  const executedJobError = executedJob.error?.response?.data?.error
  const parsedError = parseGoogleAdsError(executedJobError)

  validPayloadIndicesBitmap.forEach((index) => {
    if (!failedPayloadIndices.has(index)) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        ...parsedError,
        sent: sentBody,
        body: executedJob.error
      })
    }
  })
}
