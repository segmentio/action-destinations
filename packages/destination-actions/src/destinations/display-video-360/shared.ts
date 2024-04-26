import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { OAUTH_URL, USER_UPLOAD_ENDPOINT, SEGMENT_DMP_ID } from './constants'
import type { RefreshTokenResponse } from './types'

import {
  UserIdType,
  UpdateUsersDataRequest,
  UserDataOperation,
  UpdateUsersDataResponse,
  ErrorCode
} from './proto/protofile'

import { ListOperation, UpdateHandlerPayload, UserOperation } from './types'
import type { AudienceSettings } from './generated-types'

type DV360AuthCredentials = { refresh_token: string; access_token: string; client_id: string; client_secret: string }

export const getAuthSettings = (): DV360AuthCredentials => {
  return {
    refresh_token: process.env.ACTIONS_DISPLAY_VIDEO_360_REFRESH_TOKEN,
    client_id: process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_ID,
    client_secret: process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_SECRET
  } as DV360AuthCredentials
}

// Use the refresh token to get a new access token.
// Refresh tokens, Client_id and secret are long-lived and belong to the DMP.
// Given the short expiration time of access tokens, we need to refresh them periodically.
export const getAuthToken = async (request: RequestClient, settings: DV360AuthCredentials) => {
  if (!settings.refresh_token) {
    throw new IntegrationError('Refresh token is missing', 'INVALID_REQUEST_DATA', 400)
  }

  const { data } = await request<RefreshTokenResponse>(OAUTH_URL, {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: settings.refresh_token,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'refresh_token'
    })
  })

  return data.access_token
}

export const buildHeaders = (audienceSettings: AudienceSettings | undefined, accessToken: string) => {
  if (!audienceSettings || !accessToken) {
    throw new IntegrationError('Bad Request', 'INVALID_REQUEST_DATA', 400)
  }

  return {
    // @ts-ignore - TS doesn't know about the oauth property
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Login-Customer-Id': `products/DATA_PARTNER/customers/${SEGMENT_DMP_ID}`,
    'Linked-Customer-Id': `products/${audienceSettings.accountType}/customers/${audienceSettings?.advertiserId}`
  }
}

export const assembleRawOps = (payload: UpdateHandlerPayload, operation: ListOperation): UserOperation[] => {
  const rawOperations = []
  const audienceId = parseInt(payload.external_audience_id.split('/').pop() || '-1')
  const isDelete = operation === 'remove'

  if (payload.google_gid) {
    rawOperations.push({
      UserId: payload.google_gid,
      UserIdType: UserIdType.GOOGLE_USER_ID,
      UserListId: audienceId,
      Delete: isDelete
    })
  }

  if (payload.mobile_advertising_id) {
    const isIDFA = payload.mobile_advertising_id.includes('-')

    rawOperations.push({
      UserId: payload.mobile_advertising_id,
      UserIdType: isIDFA ? UserIdType.IDFA : UserIdType.ANDROID_ADVERTISING_ID,
      UserListId: audienceId,
      Delete: isDelete
    })
  }

  if (payload.partner_provided_id) {
    rawOperations.push({
      UserId: payload.partner_provided_id,
      UserIdType: UserIdType.PARTNER_PROVIDED_ID,
      UserListId: audienceId,
      Delete: isDelete
    })
  }

  return rawOperations
}

const handleErrorCode = (
  errorCodeString: string,
  r: UpdateUsersDataResponse,
  statsName: string,
  statsContext: StatsContext | undefined
) => {
  if (errorCodeString === 'PARTIAL_SUCCESS') {
    statsContext?.statsClient.incr(`${statsName}.error.PARTIAL_SUCCESS`, 1, statsContext?.tags)
    r.errors?.forEach((e) => {
      if (e.errorCode) {
        statsContext?.statsClient.incr(`${statsName}.error.${ErrorCode[e.errorCode]}`, 1, statsContext?.tags)
      }
    })
  } else {
    statsContext?.statsClient.incr(`${statsName}.error.${errorCodeString}`, 1, statsContext?.tags)
  }
}

export const bulkUploaderResponseHandler = async (
  response: Response,
  statsName: string,
  statsContext: StatsContext | undefined
) => {
  if (!response || !response.body) {
    throw new IntegrationError(`Something went wrong unpacking the protobuf response`, 'INVALID_REQUEST_DATA', 400)
  }

  const responseHandler = new UpdateUsersDataResponse()
  const buffer = await response.arrayBuffer()
  const protobufResponse = Buffer.from(buffer)

  const r = responseHandler.fromBinary(protobufResponse)
  const errorCode = r.status as ErrorCode
  const errorCodeString = ErrorCode[errorCode] || 'UNKNOWN_ERROR'

  if (errorCodeString === 'NO_ERROR' || response.status === 200) {
    statsContext?.statsClient.incr(`${statsName}.success`, 1, statsContext?.tags)
  } else {
    handleErrorCode(errorCodeString, r, statsName, statsContext)
    // Only internal errors shall be retried as they imply a temporary issue.
    // The rest of the errors are permanent and shall be discarded.
    // This emulates the legacy behavior of the DV360 destination.
    if (errorCode === ErrorCode.INTERNAL_ERROR) {
      statsContext?.statsClient.incr(`${statsName}.error.INTERNAL_ERROR`, 1, statsContext?.tags)
      throw new IntegrationError('Bulk Uploader Internal Error', 'INTERNAL_SERVER_ERROR', 500)
    }
  }
}

// To interact with the bulk uploader, we need to create a protobuf object as defined in the proto file.
// This method takes the raw payload and creates the protobuf object.
export const createUpdateRequest = (
  payload: UpdateHandlerPayload[],
  operation: 'add' | 'remove'
): UpdateUsersDataRequest => {
  const updateRequest = new UpdateUsersDataRequest()

  payload.forEach((p) => {
    const rawOps = assembleRawOps(p, operation)

    // Every ID will generate an operation.
    // That means that if google_gid, mobile_advertising_id, and anonymous_id are all present, we will create 3 operations.
    // This emulates the legacy behavior of the DV360 destination.
    rawOps.forEach((rawOp) => {
      const op = new UserDataOperation({
        userId: rawOp.UserId,
        userIdType: rawOp.UserIdType,
        userListId: BigInt(rawOp.UserListId),
        delete: rawOp.Delete
      })

      if (!op) {
        throw new Error('Unable to create UserDataOperation')
      }

      updateRequest.ops.push(op)
    })
  })

  // Backed by deletion and suppression features in Segment.
  updateRequest.process_consent = true

  return updateRequest
}

export const sendUpdateRequest = async (
  request: RequestClient,
  updateRequest: UpdateUsersDataRequest,
  statsName: string,
  statsContext: StatsContext | undefined
) => {
  const binaryOperation = updateRequest.toBinary()

  try {
    const response = await request(USER_UPLOAD_ENDPOINT, {
      headers: { 'Content-Type': 'application/octet-stream' },
      body: binaryOperation,
      method: 'POST'
    })

    await bulkUploaderResponseHandler(response, statsName, statsContext)
  } catch (error) {
    if (error.response?.status === 500) {
      throw new IntegrationError(error.response.message, 'INTERNAL_SERVER_ERROR', 500)
    }

    await bulkUploaderResponseHandler(error.response, statsName, statsContext)
  }
}

export const handleUpdate = async (
  request: RequestClient,
  payload: UpdateHandlerPayload[],
  operation: 'add' | 'remove',
  statsContext: StatsContext | undefined
) => {
  const statsName = operation === 'add' ? 'addToAudience' : 'removeFromAudience'
  statsContext?.statsClient?.incr(`${statsName}.call`, 1, statsContext?.tags)

  const updateRequest = createUpdateRequest(payload, operation)

  if (updateRequest.ops.length !== 0) {
    await sendUpdateRequest(request, updateRequest, statsName, statsContext)
  } else {
    statsContext?.statsClient.incr(`${statsName}.discard`, 1, statsContext?.tags)
  }

  return {
    status: 200
  }
}
