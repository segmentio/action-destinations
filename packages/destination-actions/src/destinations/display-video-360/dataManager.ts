import { IntegrationError, PayloadValidationError, RequestClient, RetryableError } from '@segment/actions-core'
import type { StatsContext } from '@segment/actions-core/destination-kit'
import { DATA_MANAGER_BASE_URL, DATA_MANAGER_MEMBERSHIP_DURATION, SEGMENT_DMP_ID } from './constants'
import type { AudienceSettings } from './generated-types'
import type { DataManagerErrorResponse, DataManagerUserList } from './types'

const RETRYABLE_DATA_MANAGER_GRPC_STATUSES = new Set([
  'UNAVAILABLE',
  'DEADLINE_EXCEEDED',
  'INTERNAL',
  'UNKNOWN',
  'ABORTED'
])

export const buildDataManagerHeaders = (audienceSettings: AudienceSettings | undefined, accessToken: string) => {
  if (!audienceSettings || !accessToken) {
    throw new IntegrationError('Bad Request', 'INVALID_REQUEST_DATA', 400)
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    // Segment acts as a DATA_PARTNER with a direct partner link to the advertiser or partner, so linked-account is
    // left unset. It is only needed when the link is held by a parent Display & Video 360 partner.
    'login-account': `accountTypes/DATA_PARTNER/accounts/${SEGMENT_DMP_ID}`
  }
}

const userListsUrl = (audienceSettings: AudienceSettings) =>
  `${DATA_MANAGER_BASE_URL}/accountTypes/${
    audienceSettings.accountType
  }/accounts/${audienceSettings.advertiserId.trim()}/userLists`

export function throwDataManagerError(err: unknown): never {
  const response = (err as { response?: { data?: DataManagerErrorResponse; status?: number } })?.response
  const errorBody = response?.data?.error
  if (!errorBody) {
    // Not a parseable Data Manager API error response (e.g. network/timeout error), rethrow as-is.
    throw err as Error
  }

  const message = errorBody.message || 'Data Manager API request failed.'
  const status = errorBody.status ?? ''

  if (RETRYABLE_DATA_MANAGER_GRPC_STATUSES.has(status)) {
    // Rewritten to 500 so that the request is retried.
    throw new RetryableError(message, 500)
  }

  if (status === 'INVALID_ARGUMENT') {
    throw new PayloadValidationError(message)
  }

  const httpStatus = errorBody.code ?? response?.status ?? 500

  if (status === 'UNAUTHENTICATED' || httpStatus === 401) {
    throw new IntegrationError(message, 'INVALID_AUTHENTICATION', 401)
  }

  throw new IntegrationError(message, status || 'INTEGRATION_ERROR', httpStatus)
}

// Mirrors GEC's createDataManagerPartnerLink: links the advertiser/partner (owning account) to Segment's data partner
// account. A 409 means the link already exists, which is treated as success.
export async function createDataManagerPartnerLink(
  request: RequestClient,
  audienceSettings: AudienceSettings,
  accessToken: string
): Promise<void> {
  const advertiserId = audienceSettings.advertiserId.trim()
  try {
    await request(
      `${DATA_MANAGER_BASE_URL}/accountTypes/${audienceSettings.accountType}/accounts/${advertiserId}/partnerLinks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'login-account': `accountTypes/DATA_PARTNER/accounts/${SEGMENT_DMP_ID}`
        },
        json: {
          owningAccount: { accountId: advertiserId, accountType: audienceSettings.accountType },
          partnerAccount: { accountId: SEGMENT_DMP_ID, accountType: 'DATA_PARTNER' }
        }
      }
    )
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 409) {
      return
    }
    throwDataManagerError(err)
  }
}

export async function createDataManagerUserList(
  request: RequestClient,
  audienceName: string,
  audienceSettings: AudienceSettings,
  accessToken: string,
  statsContext?: StatsContext
): Promise<string> {
  const { statsClient, tags } = statsContext || {}

  let userList: DataManagerUserList | undefined
  try {
    const response = await request<DataManagerUserList>(userListsUrl(audienceSettings), {
      method: 'POST',
      headers: buildDataManagerHeaders(audienceSettings, accessToken),
      json: {
        displayName: audienceName,
        description: 'Created by Segment',
        membershipDuration: DATA_MANAGER_MEMBERSHIP_DURATION,
        ingestedUserListInfo: {
          uploadKeyTypes: ['CONTACT_ID'],
          contactIdInfo: { dataSourceType: 'DATA_SOURCE_TYPE_FIRST_PARTY' }
        }
      }
    })
    userList = response.data
  } catch (err) {
    statsClient?.incr('createDataManagerAudience.error', 1, tags)
    throwDataManagerError(err)
  }

  // `name` (accountTypes/{type}/accounts/{id}/userLists/{id}) keeps assembleRawOps working,
  // as it only reads the last path segment of the external audience ID.
  const externalId = userList?.name || userList?.id
  if (!externalId) {
    statsClient?.incr('createDataManagerAudience.error', 1, tags)
    throw new IntegrationError('Failed to receive a created user list id from Data Manager.', 'INVALID_RESPONSE', 400)
  }

  statsClient?.incr('createDataManagerAudience.success', 1, tags)
  return externalId
}

export async function getDataManagerUserList(
  request: RequestClient,
  externalId: string,
  audienceSettings: AudienceSettings,
  accessToken: string,
  statsContext?: StatsContext
): Promise<DataManagerUserList> {
  const { statsClient, tags } = statsContext || {}
  // Accepts both Data Manager names and legacy Audience Partner resource names.
  const listId = externalId.split('/').pop()

  let userList: DataManagerUserList | undefined
  try {
    const response = await request<DataManagerUserList>(`${userListsUrl(audienceSettings)}/${listId}`, {
      method: 'GET',
      headers: buildDataManagerHeaders(audienceSettings, accessToken)
    })
    userList = response.data
  } catch (err) {
    statsClient?.incr('getDataManagerAudience.error', 1, tags)
    const e = err as { response?: { status?: number } }
    if (e?.response?.status === 404) {
      throw new IntegrationError(
        "Unable to verify ownership over audience. Segment Audience ID doesn't match Googles Audience ID.",
        'INVALID_REQUEST_DATA',
        400
      )
    }
    throwDataManagerError(err)
  }

  if (!userList?.id || userList.id !== listId) {
    statsClient?.incr('getDataManagerAudience.error', 1, tags)
    throw new IntegrationError(
      "Unable to verify ownership over audience. Segment Audience ID doesn't match Googles Audience ID.",
      'INVALID_REQUEST_DATA',
      400
    )
  }

  statsClient?.incr('getDataManagerAudience.success', 1, tags)
  return userList
}
