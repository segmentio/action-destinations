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
  UserListResponse,
  UserList,
  OfflineUserJobPayload,
  AddOperationPayload,
  KeyValuePairList,
  KeyValueItem,
  DataManagerUserList,
  PartnerLinkResponse
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
  ErrorCodes,
  AudienceMembership,
  FLAGS
} from '@segment/actions-core'
import { StatsContext, Personas } from '@segment/actions-core/destination-kit'
import { fullFormats } from 'ajv-formats/dist/formats'
import { HTTPError } from '@segment/actions-core'
import type { Payload as UserListPayload } from './userList/generated-types'
import type { Payload as ClickConversionPayload } from './uploadClickConversion/generated-types'
import type { Payload as ClickConversionPayload2 } from './uploadClickConversion2/generated-types'
import { STATUS_CODE_MAPPING } from './constants'
import { processHashing } from '../../lib/hashing-utils'
import {
  GOOGLE_ENHANCED_CONVERSIONS_API_VERSION,
  GOOGLE_ENHANCED_CONVERSIONS_CANARY_API_VERSION
} from './versioning-info'

export const API_VERSION = GOOGLE_ENHANCED_CONVERSIONS_API_VERSION
export const CANARY_API_VERSION = GOOGLE_ENHANCED_CONVERSIONS_CANARY_API_VERSION
export const FLAGON_NAME = 'google-enhanced-canary-version'
export const FLAGON_NAME_PHONE_VALIDATION_CHECK = 'google-enhanced-phone-validation-check'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()

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

export const DATA_MANAGER_BASE_URL = 'https://datamanager.googleapis.com/v1'

// Maps Google Ads API uploadKeyType values to Data Manager API equivalents.
// See: https://developers.google.com/data-manager/api/reference/rest/v1/accountTypes.accounts.userLists/create
const UPLOAD_KEY_TYPE_MAP: Record<string, string> = {
  CONTACT_INFO: 'CONTACT_ID',
  CRM_ID: 'USER_ID',
  MOBILE_ADVERTISING_ID: 'MOBILE_ID'
}

interface RefreshTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

/**
 * Exchanges a refresh token for a fresh OAuth access token.
 * Called explicitly for audienceConfig methods (createAudience/getAudience) because
 * those contexts do not have extendRequest applied by the framework.
 */
export async function exchangeForAccessToken(request: RequestClient, refreshToken: string): Promise<string> {
  if (!process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID || !process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET) {
    throw new PayloadValidationError('OAuth client credentials (client ID / client secret) are not configured.')
  }

  const res = await request<RefreshTokenResponse>('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ENHANCED_CONVERSIONS_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  })

  return res.data.access_token
}

/**
 * Creates a partner link between the advertiser's Google Ads account and
 * Segment's Data Partner account via the Data Manager API.
 *
 * Auth: uses the CUSTOMER's access token (scope: datamanager.partnerlink).
 *   The customer grants Segment permission to manage their audiences.
 *
 * owningAccount: the Google Ads account being linked. When the customer accesses
 *   via a Manager Account (MCC), pass loginCustomerId — Google requires the MCC
 *   details as the owningAccount in that case.
 *
 * partnerAccount: always Segment's Data Partner account (DATA_PARTNER type).
 *   partnerLinkId is NOT sent in the request body — it is assigned by Google and
 *   returned in the response.
 *
 * login-account header: resource name format required by the Data Manager API
 *   (accountTypes/{type}/accounts/{id}), not just a bare account ID.
 */
export async function createDataManagerPartnerLink(
  request: RequestClient,
  customerId: string,
  customerAccessToken: string,
  loginCustomerId?: string
): Promise<PartnerLinkResponse> {
  const partnerAccountId = '262932431'
  if (!partnerAccountId) {
    throw new IntegrationError(
      'GOOGLE_DATA_MANAGER_PARTNER_ACCOUNT_ID environment variable is not set.',
      'MISSING_PARTNER_ACCOUNT_ID',
      400
    )
  }

  // When the customer uses an MCC to access a sub-account, the owningAccount
  // must be the MCC (loginCustomerId), not the sub-account.
  const owningAccountId = loginCustomerId || customerId

  const url = `${DATA_MANAGER_BASE_URL}/accountTypes/GOOGLE_ADS/accounts/${customerId}/partnerLinks`

  const response = await request<PartnerLinkResponse>(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${customerAccessToken}`,
      // login-account must be a resource name, not a bare account ID
      'login-account': `accountTypes/GOOGLE_ADS/accounts/${owningAccountId}`
    },
    json: {
      owningAccount: { accountId: owningAccountId, accountType: 'GOOGLE_ADS' },
      partnerAccount: { accountId: partnerAccountId, accountType: 'DATA_PARTNER' }
    }
  })

  return response.data
}

/**
 * Creates a new Customer Match user list via the Data Manager API.
 *
 * Auth: uses Segment's partner account access token (scope: datamanager).
 *   The login-account header identifies Segment's Data Partner account using the
 *   resource name format required by the Data Manager API.
 */
export async function createDataManagerUserList(
  request: RequestClient,
  customerId: string,
  listName: string,
  uploadKeyType: string,
  segmentAccessToken: string,
  appId?: string
): Promise<DataManagerUserList> {
  const partnerAccountId = '262932431'
  const url = `${DATA_MANAGER_BASE_URL}/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists`

  const response = await request<DataManagerUserList>(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${segmentAccessToken}`,
      // login-account must be a resource name, not a bare account ID
      ...(partnerAccountId && { 'login-account': `accountTypes/DATA_PARTNER/accounts/${partnerAccountId}` })
    },
    json: {
      displayName: listName,
      uploadKeyType: UPLOAD_KEY_TYPE_MAP[uploadKeyType] ?? uploadKeyType,
      ...(appId && { appId })
    }
  })

  return response.data
}

/**
 * Fetches an existing user list by ID via the Data Manager API.
 *
 * Auth: uses Segment's partner account access token (scope: datamanager).
 */
export async function getDataManagerUserList(
  request: RequestClient,
  customerId: string,
  userListId: string,
  segmentAccessToken: string
): Promise<DataManagerUserList> {
  const partnerAccountId = '262932431'
  const url = `${DATA_MANAGER_BASE_URL}/accountTypes/GOOGLE_ADS/accounts/${customerId}/userLists/${userListId}`

  const response = await request<DataManagerUserList>(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${segmentAccessToken}`,
      ...(partnerAccountId && { 'login-account': `accountTypes/DATA_PARTNER/accounts/${partnerAccountId}` })
    }
  })

  return response.data
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
        code: String((err as GoogleAdsError).response?.status ?? 500)
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

export function timestampToEpochMicroseconds(timestamp: string): string | undefined {
  if (!timestamp) {
    return undefined
  }
  const date = new Date(timestamp)
  if (!isNaN(date.getTime())) {
    return (date.getTime() * 1000).toString()
  }
  return undefined
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
        code: String((err as GoogleAdsError).response?.status ?? 500)
      }
    }
  }
}

export async function createGoogleAudience(
  request: RequestClient,
  input: CreateAudienceInput,
  segmentAccessToken: string,
  statsContext?: StatsContext
): Promise<string> {
  if (input.audienceSettings.external_id_type === 'MOBILE_ADVERTISING_ID' && !input.audienceSettings.app_id) {
    throw new PayloadValidationError('App ID is required when external ID type is mobile advertising ID.')
  }

  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags

  const userList = await createDataManagerUserList(
    request,
    input.settings.customerId!,
    input.audienceName,
    input.audienceSettings.external_id_type ?? 'CONTACT_INFO',
    segmentAccessToken,
    input.audienceSettings.app_id
  )

  if (!userList?.id) {
    statsClient?.incr('createAudience.error', 1, statsTags)
    throw new IntegrationError('Failed to receive a created customer list id.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('createAudience.success', 1, statsTags)
  return userList.id
}

export async function getGoogleAudience(
  request: RequestClient,
  settings: CreateAudienceInput['settings'],
  externalId: string,
  segmentAccessToken: string,
  statsContext?: StatsContext
): Promise<UserListResponse> {
  const statsClient = statsContext?.statsClient
  const statsTags = statsContext?.tags

  const userList = await getDataManagerUserList(request, settings.customerId!, externalId, segmentAccessToken)

  if (!userList?.id) {
    statsClient?.incr('getAudience.error', 1, statsTags)
    throw new IntegrationError('Failed to receive a customer list.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('getAudience.success', 1, statsTags)
  // Adapt Data Manager response shape to the UserListResponse shape expected by callers
  return {
    results: [{ userList: { resourceName: userList.name, id: userList.id, name: userList.displayName } }],
    fieldMask: ''
  }
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

export const formatPhone = (
  phone: string,
  countryCode?: string,
  features?: Features,
  statsContext?: StatsContext
): string => {
  // Check if phone number is already hashed before doing any formatting
  if (isHashedInformation(phone)) {
    return phone
  }
  let formattedPhone
  if (features && features[FLAGON_NAME_PHONE_VALIDATION_CHECK]) {
    formattedPhone = validateAndFormatToE164(phone, countryCode ?? '+1', statsContext)
  } else {
    // If phone validation check is disabled, just format to E.164
    formattedPhone = formatToE164(phone, countryCode ?? '+1')
  }

  // TODO: Log stats for pre-formatted phone numbers, Will remove it in clean up
  if (phone == formattedPhone) {
    statsContext?.statsClient?.incr('validateAndFormatPhone.pre_formatted', 1, statsContext?.tags)
  }
  return formattedPhone
}

export const validateAndFormatToE164 = (
  phoneNumber: string,
  countryCode?: string,
  statsContext?: StatsContext
): string => {
  try {
    let regionCode = 'US' // default region

    // If numeric country code is provided, convert to region code
    if (countryCode) {
      const intCode = parseInt(countryCode.replace(/\D/g, ''))
      regionCode = phoneUtil.getRegionCodeForCountryCode(intCode) || 'US'
    }

    // Parse the phone number using region
    const parsedNumber = phoneUtil.parseAndKeepRawInput(phoneNumber, regionCode)

    // Validate the number
    if (!phoneUtil.isValidNumber(parsedNumber)) {
      statsContext?.statsClient?.incr('validateAndFormatPhone.error', 1, statsContext?.tags)
      throw new PayloadValidationError('Invalid phone number or country code.')
    }

    statsContext?.statsClient?.incr('validateAndFormatPhone.success', 1, statsContext?.tags)
    // Return E.164 formatted number
    return phoneUtil.format(parsedNumber, PhoneNumberFormat.E164)
  } catch (error) {
    statsContext?.statsClient?.incr('validateAndFormatPhone.error', 1, statsContext?.tags)
    throw new PayloadValidationError((error as Error).message || 'Invalid phone number or country code.')
  }
}

const extractUserIdentifiers = (
  payloads: UserListPayload[],
  idType: string,
  syncMode?: string,
  features?: Features | undefined,
  statsContext?: StatsContext | undefined,
  audienceMembership?: AudienceMembership,
  personasContext?: Personas
) => {
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
            formatPhone(value, payload.phone_country_code, features, statsContext)
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

  const { computation_class } = personasContext || {}
  for (const payload of payloads) {
    if (features?.[FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]) {
      if (
        payload.event_name === 'Audience Entered' ||
        syncMode === 'add' ||
        (syncMode === 'mirror' && (payload.event_name === 'new' || payload.event_name === 'updated')) ||
        audienceMembership === true
      ) {
        addUserIdentifiers.push({ create: { userIdentifiers: identifierFunctions[idType](payload) } })
      } else if (
        payload.event_name === 'Audience Exited' ||
        syncMode === 'delete' ||
        (syncMode === 'mirror' && payload.event_name === 'deleted') ||
        audienceMembership === false
      ) {
        removeUserIdentifiers.push({ remove: { userIdentifiers: identifierFunctions[idType](payload) } })
      } else if (computation_class === 'journey_step') {
        // For legacy Journeys preset journeys_step_entered_track which omits properties[<computation_key>]
        // Should always adds the user, never delete
        addUserIdentifiers.push({ create: { userIdentifiers: identifierFunctions[idType](payload) } })
      }
    } else {
      // Map user data to Google Ads API format
      if (
        payload.event_name === 'Audience Entered' ||
        syncMode === 'add' ||
        (syncMode === 'mirror' && (payload.event_name === 'new' || payload.event_name === 'updated'))
      ) {
        addUserIdentifiers.push({ create: { userIdentifiers: identifierFunctions[idType](payload) } })
      } else if (
        payload.event_name === 'Audience Exited' ||
        syncMode === 'delete' ||
        (syncMode === 'mirror' && payload.event_name === 'deleted')
      ) {
        removeUserIdentifiers.push({ remove: { userIdentifiers: identifierFunctions[idType](payload) } })
      } else if (computation_class === 'journey_step') {
        // For legacy Journeys preset journeys_step_entered_track which omits properties[<computation_key>]
        // Should always adds the user, never delete
        addUserIdentifiers.push({ create: { userIdentifiers: identifierFunctions[idType](payload) } })
      }
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
      // https://developers.google.com/google-ads/api/reference/rpc/v21/DatabaseErrorEnum.DatabaseError
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
  statsContext?: StatsContext,
  audienceMembership?: AudienceMembership,
  personasContext?: Personas
) => {
  const externalAudienceId: string | undefined = hookListId || payloads[0]?.external_audience_id
  if (!externalAudienceId) {
    throw new PayloadValidationError('External Audience ID is required.')
  }
  const id_type = hookListType ?? audienceSettings.external_id_type
  // Format the user data for Google Ads API
  const [adduserIdentifiers, removeUserIdentifiers] = extractUserIdentifiers(
    payloads,
    id_type,
    syncMode,
    features,
    statsContext,
    audienceMembership,
    personasContext
  )
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

export const createIdentifierExtractors = (features?: Features) => ({
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
          formatPhone(value, payload.phone_country_code, features)
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
  syncMode?: string,
  features?: Features,
  audienceMemberships?: AudienceMembership[],
  personasContext?: Personas
) => {
  const removeUserIdentifiers: any[] = []
  const addUserIdentifiers: any[] = []
  const validPayloadIndicesBitmap: number[] = []

  //Identify the user identifiers based on the idType
  const extractors = createIdentifierExtractors(features)

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
    const operationType = determineOperationType(
      payload,
      syncMode,
      features,
      audienceMemberships?.[index],
      personasContext
    )
    if (operationType === undefined) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Could not determine Operation Type.'
      })
      return
    }

    validPayloadIndicesBitmap.push(index)
    if (operationType === true) {
      addUserIdentifiers.push({ create: { userIdentifiers } })
    } else {
      removeUserIdentifiers.push({ remove: { userIdentifiers } })
    }
  })

  return { addUserIdentifiers, removeUserIdentifiers, validPayloadIndicesBitmap }
}

// Helper function to determine operation type
const determineOperationType = (
  payload: UserListPayload,
  syncMode?: string,
  features?: Features,
  audienceMembership?: AudienceMembership,
  personasContext?: Personas
): boolean | undefined => {
  const { computation_class } = personasContext || {}
  if (features?.[FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]) {
    if (
      payload.event_name === 'Audience Entered' ||
      syncMode === 'add' ||
      (syncMode === 'mirror' && (payload.event_name === 'new' || payload.event_name === 'updated')) ||
      audienceMembership === true
    ) {
      return true
    } else if (
      payload.event_name === 'Audience Exited' ||
      syncMode === 'delete' ||
      (syncMode === 'mirror' && payload.event_name === 'deleted') ||
      audienceMembership === false
    ) {
      return false
    } else if (computation_class === 'journey_step') {
      // For legacy Journeys preset journeys_step_entered_track which omits properties[<computation_key>]
      // Should always adds the user, never delete
      return true
    }
  } else {
    if (
      payload.event_name === 'Audience Entered' ||
      syncMode === 'add' ||
      (syncMode === 'mirror' && (payload.event_name === 'new' || payload.event_name === 'updated'))
    ) {
      return true
    } else if (
      payload.event_name === 'Audience Exited' ||
      syncMode === 'delete' ||
      (syncMode === 'mirror' && payload.event_name === 'deleted')
    ) {
      return false
    } else if (computation_class === 'journey_step') {
      // For legacy Journeys preset journeys_step_entered_track which omits properties[<computation_key>]
      // Should always adds the user, never delete
      return true
    }
  }
  return undefined
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
  statsContext?: StatsContext,
  audienceMemberships?: AudienceMembership[],
  personasContext?: Personas
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
    syncMode,
    features,
    audienceMemberships,
    personasContext
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

export function getSessionAttributesKeyValuePairs(payload: ClickConversionPayload | ClickConversionPayload2) {
  const {
    session_attributes_key_value_pairs: {
      gad_source,
      gad_campaignid,
      landing_page_url,
      session_start_time_usec,
      landing_page_referrer,
      landing_page_user_agent
    } = {}
  } = payload

  const sessionStartTimeUsec =
    typeof session_start_time_usec === 'string' ? timestampToEpochMicroseconds(session_start_time_usec) : undefined

  const entries: [KeyValueItem['sessionAttributeKey'], string | undefined][] = [
    ['gad_source', gad_source],
    ['gad_campaignid', gad_campaignid],
    ['landing_page_url', landing_page_url],
    ['session_start_time_usec', sessionStartTimeUsec],
    ['landing_page_referrer', landing_page_referrer],
    ['landing_page_user_agent', landing_page_user_agent]
  ]

  const keyValuePairList: KeyValuePairList = entries
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({
      sessionAttributeKey: key,
      sessionAttributeValue: value
    }))

  return keyValuePairList.length > 0 ? { sessionAttributesKeyValuePairs: { keyValuePairs: keyValuePairList } } : {}
}
