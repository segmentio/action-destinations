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
  AudienceInputs,
  AudienceResponse,
  CreateAudienceJSON,
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
    statsClient?.incr(`${statsName}.error`, 1, [...tags, 'error:missing-settings'])
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
            token,
            features,
            statsContext
          })

    statsClient?.incr(`${statsName}.success`, 1, [...tags, `audience:${result.outcome}`])
    return result
  } catch (error) {
    const code = error instanceof IntegrationError ? error.code : 'unknown'
    statsClient?.incr(`${statsName}.error`, 1, [...tags, `error:${code}`])
    throw error
  }
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
    return { error: 'Missing advertiser ID value' }
  }

  if (!audienceType) {
    return { error: 'Missing audience type value' }
  }

  if (operation === 'existing') {
    if (!existingAudienceId) {
      return { error: 'Missing audience ID value' }
    }
    return { operation, advertiserId, existingAudienceId, audienceType }
  }

  if (!audienceName) {
    return { error: 'Missing audience name value' }
  }

  const rawDays = typeof membershipDurationDays === 'string' ? membershipDurationDays.trim() : membershipDurationDays
  if (rawDays === undefined || rawDays === null || rawDays === '') {
    return { error: 'Missing membership duration days value' }
  }

  const days = Number(rawDays)
  if (!Number.isInteger(days) || days < 1 || days > 540) {
    return { error: 'Membership duration days must be a whole number greater than 0 and less than or equal to 540' }
  }

  // DV360 takes membershipDurationDays as an int64, which is a string over JSON.
  return {
    operation,
    advertiserId,
    audienceName,
    audienceType,
    membershipDurationDays: String(days),
    description,
    appId
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
    throw new IntegrationError(
      `Could not connect to the existing Display & Video 360 audience with ID "${existingAudienceId}": its type is ${audience.audienceType}, but the Audience Type setting is ${audienceType}. Update the Audience Type setting to match, or create a new audience instead.`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      400
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
    throw new IntegrationError(
      `Failed to retrieve audience ${audienceId} from Display & Video 360: ${describeError(response)}`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      response.status
    )
  }

  if (!response.data?.firstPartyAndPartnerAudienceId) {
    throw new IntegrationError(
      `Failed to retrieve audience ${audienceId} from Display & Video 360: ${describeMissingAudienceId(response)}`,
      ErrorCodes.GET_AUDIENCE_FAILED,
      400
    )
  }

  return response.data
}

async function createAudience(
  request: RequestClient,
  params: CreateAudienceJSON
): Promise<CreateOrConnectAudienceResult> {
  const {
    advertiserId,
    audienceName,
    description,
    membershipDurationDays,
    audienceType,
    appId,
    token,
    features,
    statsContext
  } = params

  const version = getApiVersion(features, statsContext)
  const endpoint = getAudienceEndpoint(version, advertiserId)

  const response = await sendDV360Request<AudienceResponse>(
    request,
    endpoint,
    {
      method: 'POST',
      headers: authHeaders(token),
      json: {
        displayName: audienceName,
        audienceType,
        membershipDurationDays,
        description,
        audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
        firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY',
        appId
      }
    },
    ErrorCodes.CREATE_AUDIENCE_FAILED
  )

  const audienceId = response.data?.firstPartyAndPartnerAudienceId
  if (response.ok && audienceId) {
    return { audienceId, advertiserId, audienceType, appId, outcome: 'created' }
  }

  if (DISPLAY_NAME_EXISTS.test(response.data?.error?.message ?? '')) {
    const existing = await getAudienceByName(request, { advertiserId, audienceName, token, features, statsContext })
    const existingId = existing?.firstPartyAndPartnerAudienceId

    if (existingId) {
      const existingAppId = existing.appId || undefined
      const requestedAppId = appId?.trim() || undefined
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
          : []),
        ...(existingAppId !== requestedAppId
          ? [`App ID is ${existingAppId ?? 'not set'} (requested ${requestedAppId ?? 'not set'})`]
          : [])
      ]

      if (mismatches.length) {
        throw new IntegrationError(
          `An audience named "${audienceName}" already exists in Display & Video 360 (ID ${existingId}) but its settings differ: ${mismatches.join(
            '; '
          )}. Update the audience settings to match, choose a different Audience Name, or connect to it with the "Existing Audience ID" setting.`,
          ErrorCodes.CREATE_AUDIENCE_FAILED,
          400
        )
      }
      return { audienceId: existingId, advertiserId, audienceType, appId, outcome: 'reconnected' }
    }
  }

  if (!response.ok) {
    throw new IntegrationError(
      `Failed to create audience in Display & Video 360: ${describeError(response)}`,
      ErrorCodes.CREATE_AUDIENCE_FAILED,
      response.status
    )
  }

  throw new IntegrationError(
    `Failed to create audience in Display & Video 360: ${describeMissingAudienceId(response)}`,
    ErrorCodes.CREATE_AUDIENCE_FAILED,
    400
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
      throw new IntegrationError(
        `Failed to look up existing audience "${audienceName}" in Display & Video 360: ${describeError(response)}`,
        ErrorCodes.GET_AUDIENCE_FAILED,
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

  if (matches.length === 0) {
    return undefined
  }

  if (matches.length > 1) {
    const ids = matches
      .slice(0, MAX_IDS_IN_ERROR)
      .map((a) => a.firstPartyAndPartnerAudienceId)
      .join(', ')
    const more = matches.length > MAX_IDS_IN_ERROR ? ` and ${matches.length - MAX_IDS_IN_ERROR} more` : ''
    throw new IntegrationError(
      `More than one first party audience named "${audienceName}" exists in Display & Video 360 (IDs ${ids}${more}). Connect to the correct one with the "Existing Audience ID" setting, or choose a different Audience Name.`,
      ErrorCodes.CREATE_AUDIENCE_FAILED,
      400
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
    throw new IntegrationError(
      `Could not reach Display & Video 360: ${error instanceof Error ? error.message : String(error)}`,
      errorCode,
      500
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
