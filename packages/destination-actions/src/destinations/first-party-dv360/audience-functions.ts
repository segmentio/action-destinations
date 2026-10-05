import {
  ErrorCodes,
  Features,
  IntegrationError,
  ModifiedResponse,
  RequestClient,
  RequestOptions,
  StatsContext
} from '@segment/actions-core'
import { DV360API, getApiVersion } from './functions'
import {
  AudienceError,
  AudienceInputs,
  AudienceResponse,
  CreateAudienceJSON,
  CreateAudienceParams,
  CreateOrConnectAudienceOptions,
  CreateOrConnectAudienceResult,
  DV360Error,
  GetAudienceByNameParams,
  GetAudienceParams,
  ListAudiencesResponse,
  ValidatedAudienceInputs
} from './types'

const DESTINATION_SLUG = 'actions-first-party-dv360'
const DISPLAY_NAME_EXISTS = /already exists/i
const LIST_MAX_PAGES = 10
const MAX_IDS_IN_ERROR = 5

export async function createOrConnectAudience(
  request: RequestClient,
  inputs: AudienceInputs,
  options: CreateOrConnectAudienceOptions
): Promise<CreateOrConnectAudienceResult> {
  const { statsName, token, features, statsContext } = options
  const statsClient = statsContext?.statsClient
  const tags = [...(statsContext?.tags ?? []), `slug:${DESTINATION_SLUG}`]
  statsClient?.incr(`${statsName}.call`, 1, tags)

  const validated = validateAudienceInputs(inputs)
  if ('error' in validated) {
    statsClient?.incr(`${statsName}.error`, 1, [...tags, 'error:missing-settings', `reason:${validated.reason}`])
    throw new IntegrationError(validated.error, 'MISSING_REQUIRED_FIELD', 400)
  }

  try {
    const result =
      validated.operation === 'existing'
        ? await connectToExistingAudience(request, validated, token, features, statsContext)
        : await createAudience(request, {
            advertiserId: validated.advertiserId,
            audienceName: validated.audienceName,
            audienceType: validated.audienceType,
            membershipDurationDays: validated.membershipDurationDays,
            description: validated.description,
            appId: validated.appId,
            connectIfExists: validated.operation === 'create_or_connect',
            token,
            features,
            statsContext
          })

    statsClient?.incr(`${statsName}.success`, 1, [...tags, `audience:${result.outcome}`])
    return result
  } catch (error) {
    const code = error instanceof IntegrationError ? error.code : 'unknown'
    const { reason = 'unknown', dv360Status } = error as Partial<AudienceError>
    statsClient?.incr(`${statsName}.error`, 1, [
      ...tags,
      `error:${code}`,
      `reason:${reason}`,
      ...(dv360Status ? [`status:${dv360Status}`] : [])
    ])
    throw error
  }
}

function audienceError(
  message: string,
  code: string,
  status: number,
  reason: string,
  dv360Status?: number
): AudienceError {
  return Object.assign(new IntegrationError(message, code, status), { reason, dv360Status })
}

export function validateAudienceInputs(inputs: AudienceInputs): ValidatedAudienceInputs {
  const { operation, membershipDurationDays } = inputs
  const advertiserId = trim(inputs.advertiserId)
  const audienceName = trim(inputs.audienceName)
  const audienceType = trim(inputs.audienceType)
  const description = trim(inputs.description)
  const appId = trim(inputs.appId)
  const existingAudienceId = trim(inputs.existingAudienceId)

  if (!advertiserId) {
    return { error: 'Missing advertiser ID value', reason: 'missing-advertiser-id' }
  }

  if (!audienceType) {
    return { error: 'Missing audience type value', reason: 'missing-audience-type' }
  }

  if (operation === 'existing') {
    if (!existingAudienceId) {
      return { error: 'Missing Existing Audience ID value', reason: 'missing-audience-id' }
    }
    return { operation, advertiserId, existingAudienceId, audienceType }
  }

  if (!audienceName) {
    return { error: 'Missing audience name value', reason: 'missing-audience-name' }
  }

  const rawDays = typeof membershipDurationDays === 'string' ? membershipDurationDays.trim() : membershipDurationDays
  if (rawDays === undefined || rawDays === null || rawDays === '') {
    return { error: 'Missing membership duration days value', reason: 'missing-membership-duration' }
  }

  const days = Number(rawDays)
  if (!Number.isInteger(days) || days < 1 || days > 540) {
    return {
      error: 'Membership duration days must be a whole number greater than 0 and less than or equal to 540',
      reason: 'invalid-membership-duration'
    }
  }

  // DV360 takes membershipDurationDays as an int64, which is a string over JSON.
  return {
    operation,
    advertiserId,
    audienceName,
    audienceType,
    membershipDurationDays: String(days),
    description,
    ...(audienceType === 'CUSTOMER_MATCH_DEVICE_ID' ? { appId } : {})
  }
}

async function connectToExistingAudience(
  request: RequestClient,
  validated: Extract<ValidatedAudienceInputs, { operation: 'existing' }>,
  token?: string,
  features?: Features,
  statsContext?: StatsContext
): Promise<CreateOrConnectAudienceResult> {
  const { advertiserId, existingAudienceId, audienceType } = validated
  const audience = await getAudience(request, {
    advertiserId,
    audienceId: existingAudienceId,
    token,
    features,
    statsContext
  })

  if (audience.audienceType !== audienceType) {
    throw audienceError(
      `Could not connect to the existing Display & Video 360 audience with ID "${existingAudienceId}": its type is ${audience.audienceType}, but the Audience Type setting is ${audienceType}. Update the Audience Type setting to match, or create a new audience instead.`,
      ErrorCodes.CREATE_AUDIENCE_FAILED,
      400,
      'existing-type-mismatch'
    )
  }

  return { audienceId: existingAudienceId, advertiserId, audienceType, appId: audience.appId, outcome: 'existing' }
}

export async function getAudience(request: RequestClient, params: GetAudienceParams): Promise<AudienceResponse> {
  const { advertiserId, audienceId, token, features, statsContext } = params

  const version = getApiVersion(features, statsContext)
  const endpoint = getAudienceEndpoint(version, advertiserId, audienceId)

  const response = await sendDV360Request<AudienceResponse>(
    request,
    endpoint,
    { method: 'GET', headers: authHeaders(token) },
    ErrorCodes.GET_AUDIENCE_FAILED
  )

  if (!response.ok) {
    throw audienceError(
      `Failed to retrieve audience ${audienceId} from Display & Video 360: ${describeError(response)}`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      400,
      'dv360-error',
      response.status
    )
  }

  if (!response.data?.firstPartyAndPartnerAudienceId) {
    throw audienceError(
      `Failed to retrieve audience ${audienceId} from Display & Video 360: ${describeMissingAudienceId(response)}`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      400,
      'no-audience-id-in-response',
      response.status
    )
  }

  return response.data
}

async function createAudience(
  request: RequestClient,
  params: CreateAudienceParams
): Promise<CreateOrConnectAudienceResult> {
  const {
    advertiserId,
    audienceName,
    description,
    membershipDurationDays,
    audienceType,
    appId,
    connectIfExists,
    token,
    features,
    statsContext
  } = params

  const version = getApiVersion(features, statsContext)
  const endpoint = getAudienceEndpoint(version, advertiserId)
  const json: CreateAudienceJSON = {
    displayName: audienceName,
    audienceType,
    membershipDurationDays,
    description,
    audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
    firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY',
    appId
  }

  const response = await sendDV360Request<AudienceResponse>(
    request,
    endpoint,
    {
      method: 'POST',
      headers: authHeaders(token),
      json
    },
    ErrorCodes.CREATE_AUDIENCE_FAILED
  )

  const audienceId = response.data?.firstPartyAndPartnerAudienceId
  if (response.ok && audienceId) {
    return { audienceId, advertiserId, audienceType, appId, outcome: 'created' }
  }

  const nameExists = DISPLAY_NAME_EXISTS.test(response.data?.error?.message ?? '')
  if (nameExists) {
    const existing = await getAudienceByName(request, { advertiserId, audienceName, token, features, statsContext })
    const existingId = existing?.firstPartyAndPartnerAudienceId

    if (existingId && !connectIfExists) {
      throw audienceError(
        `An audience named "${audienceName}" already exists in Display & Video 360 (ID ${existingId}). To use it, set "Create or Connect Audience" to "Connect to existing audience" and enter ${existingId} as the Existing Audience ID, or choose "Create new audience, or connect to an existing one with the same name". Otherwise, choose a different Audience Name.`,
        ErrorCodes.CREATE_AUDIENCE_FAILED,
        400,
        'name-exists'
      )
    }

    if (existingId) {
      const mismatches = [
        ...(existing.audienceType !== audienceType
          ? [`Audience Type is ${existing.audienceType} (requested ${audienceType})`]
          : []),
        ...(Number(existing.membershipDurationDays) !== Number(membershipDurationDays)
          ? [
              `Membership Duration Days is ${
                existing.membershipDurationDays ?? 'not set'
              } (requested ${membershipDurationDays})`
            ]
          : [])
      ]

      if (mismatches.length) {
        throw audienceError(
          `An audience named "${audienceName}" already exists in Display & Video 360 (ID ${existingId}) but its settings differ: ${mismatches.join(
            '; '
          )}. Update the audience settings to match, choose a different Audience Name, or set "Create or Connect Audience" to "Connect to existing audience" and enter ${existingId} as the Existing Audience ID.`,
          ErrorCodes.CREATE_AUDIENCE_FAILED,
          400,
          'name-exists-settings-mismatch'
        )
      }
      return { audienceId: existingId, advertiserId, audienceType, appId, outcome: 'reconnected' }
    }
  }

  if (!response.ok) {
    throw audienceError(
      `Failed to create audience in Display & Video 360: ${describeError(response)}`,
      ErrorCodes.CREATE_AUDIENCE_FAILED,
      400,
      nameExists ? 'name-exists-not-found' : 'dv360-error',
      response.status
    )
  }

  throw audienceError(
    `Failed to create audience in Display & Video 360: ${describeMissingAudienceId(response)}`,
    ErrorCodes.CREATE_AUDIENCE_FAILED,
    400,
    'no-audience-id-in-response',
    response.status
  )
}

export async function getAudienceByName(
  request: RequestClient,
  params: GetAudienceByNameParams
): Promise<AudienceResponse | undefined> {
  const { advertiserId, audienceName, token, features, statsContext } = params

  const version = getApiVersion(features, statsContext)
  const filter = encodeURIComponent(`displayName:"${audienceName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  let pageToken: string | undefined
  const matches: AudienceResponse[] = []

  for (let page = 0; page < LIST_MAX_PAGES; page++) {
    const endpoint = `${getAudienceEndpoint(version, advertiserId)}&filter=${filter}${
      pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    }`

    const response = await sendDV360Request<ListAudiencesResponse>(
      request,
      endpoint,
      { method: 'GET', headers: authHeaders(token) },
      ErrorCodes.GET_AUDIENCE_FAILED
    )

    if (!response.ok) {
      throw audienceError(
        `An audience named "${audienceName}" already exists in Display & Video 360, but Segment could not look it up: ${describeError(
          response
        )}`,
        ErrorCodes.GET_AUDIENCE_FAILED,
        400,
        'name-exists-lookup-failed',
        response.status
      )
    }

    matches.push(
      ...(response.data?.firstPartyAndPartnerAudiences ?? []).filter(
        (a) => a.displayName === audienceName && a.firstPartyAndPartnerAudienceType === 'TYPE_FIRST_PARTY'
      )
    )

    pageToken = response.data?.nextPageToken
    if (!pageToken) {
      break
    }
  }

  if (pageToken) {
    throw audienceError(
      `An audience named "${audienceName}" already exists in Display & Video 360, but Segment could not confirm it is the only one after searching ${LIST_MAX_PAGES} pages of results. Find the audience's ID in Display & Video 360, set "Create or Connect Audience" to "Connect to existing audience" and enter it as the Existing Audience ID, or choose a different Audience Name.`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      400,
      'name-exists-page-limit'
    )
  }

  if (matches.length === 0) {
    return undefined
  }

  if (matches.length > 1) {
    const ids = matches
      .slice(0, MAX_IDS_IN_ERROR)
      .map((a) => a.firstPartyAndPartnerAudienceId)
      .join(', ')
    const more = matches.length > MAX_IDS_IN_ERROR ? ` and ${matches.length - MAX_IDS_IN_ERROR} more` : ''
    throw audienceError(
      `More than one first party audience named "${audienceName}" exists in Display & Video 360 (IDs ${ids}${more}). Set "Create or Connect Audience" to "Connect to existing audience" and enter the correct one as the Existing Audience ID, or choose a different Audience Name.`,
      ErrorCodes.CREATE_AUDIENCE_FAILED,
      400,
      'name-exists-multiple-matches'
    )
  }

  return matches[0]
}

function getAudienceEndpoint(version: string, advertiserId: string, audienceId?: string): string {
  if (audienceId) {
    return DV360API + `${version}/firstPartyAndPartnerAudiences/` + `${audienceId}?advertiserId=${advertiserId}`
  } else {
    return DV360API + `${version}/firstPartyAndPartnerAudiences` + `?advertiserId=${advertiserId}`
  }
}

function authHeaders(token?: string) {
  return {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json; charset=utf-8'
  }
}

async function sendDV360Request<T>(
  request: RequestClient,
  url: string,
  options: RequestOptions,
  errorCode: string
): Promise<ModifiedResponse<T>> {
  try {
    return await request<T>(url, { ...options, throwHttpErrors: false })
  } catch (error) {
    throw audienceError(
      `Could not reach Display & Video 360: ${error instanceof Error ? error.message : String(error)}`,
      errorCode,
      500,
      'network-error'
    )
  }
}

function trim(value?: string): string | undefined {
  return value?.trim() || undefined
}

function describeError(response: ModifiedResponse<{ error?: DV360Error }>): string {
  return response.data?.error?.message ?? `HTTP ${response.status}`
}

function describeMissingAudienceId(response: ModifiedResponse<AudienceResponse>): string {
  return response.data?.error?.message ?? 'the response did not include an audience ID'
}
