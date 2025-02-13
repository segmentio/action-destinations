import { createRequestClient, ModifiedResponse, PayloadValidationError, RequestClient } from '@segment/actions-core'

import { Settings } from './generated-types'
import { RefreshTokenResponse, ResponsysCustomTraitsRequestBody } from './types'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

// Rate limits per endpoint.
// Can be obtained through `/rest/api/ratelimit`, but at the point
// this project is, there's no good way to calling it without a huge
// drop in performance.
// We are using here the most common values observed in our customers.

// getAsyncResponse (`requests/${requestId}`, GET): 1000 requests per minute.
// Around 1 request every 60ms.
const getAsyncResponseWaitInterval = 60

export const getAuthToken = async (request: RequestClient, settings: Settings): Promise<string> => {
  const baseUrl = settings.baseUrl?.replace(/\/$/, '')
  const { data } = await request<RefreshTokenResponse>(`${baseUrl}/rest/api/v1.3/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `user_name=${encodeURIComponent(settings.username)}&password=${encodeURIComponent(
      settings.userPassword
    )}&auth_type=password`
  })

  return data.authToken
}

export const petExists = async (
  request: RequestClient,
  settings: Settings,
  computationKey: string,
  authToken: string
) => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET',
    skipResponseCloning: true,
    headers: {
      'Content-Type': 'application/json',
      authorization: `${authToken}`
    }
  })

  const results = response.data as { profileExtension?: { objectName: string } }[]
  return results.find(
    (item: { profileExtension?: { objectName: string } }) => item.profileExtension?.objectName === computationKey
  )
}

export const createPet = async (
  request: RequestClient,
  settings: Settings,
  audienceName: string,
  authToken: string
) => {
  const requestBody = {
    profileExtension: {
      objectName: audienceName,
      folderName: settings.defaultFolderName
    },
    fields: [
      {
        fieldName: audienceName.substring(0, 30),
        fieldType: 'STR500'
      }
    ]
  }

  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${authToken}`
    },
    body: JSON.stringify(requestBody)
  })

  return response
}

export const getAllPets = async (
  request: RequestClient,
  settings: Settings,
  authToken: string
): Promise<{ profileExtension: { objectName: string } }[]> => {
  const path = `/rest/api/v1.3/lists/${settings.profileListName}/listExtensions`
  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'GET',
    skipResponseCloning: true,
    headers: {
      'Content-Type': 'application/json',
      authorization: `${authToken}`
    }
  })

  return response.data as { profileExtension: { objectName: string } }[]
}

export const validateListMemberPayload = ({
  EMAIL_ADDRESS_,
  RIID_,
  CUSTOMER_ID_
}: {
  EMAIL_ADDRESS_?: string
  RIID_?: string
  CUSTOMER_ID_?: string
}): void => {
  if (!EMAIL_ADDRESS_ && !RIID_ && !CUSTOMER_ID_) {
    throw new PayloadValidationError(
      'At least one of the following fields is required: Email Address, RIID, or Customer ID'
    )
  }
}

export const sendDebugMessageToSegmentSource = async (
  request: RequestClient,
  requestBody: ResponsysCustomTraitsRequestBody,
  response: ModifiedResponse<any>,
  settings: Settings
) => {
  const segmentWriteKeyRegion = settings.segmentWriteKeyRegion || 'US'
  if (settings.segmentWriteKey) {
    try {
      const body = response.data
      await request(
        segmentWriteKeyRegion === 'EU'
          ? 'https://events.eu1.segmentapis.com/v1/track'
          : 'https://api.segment.io/v1/track',
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(settings.segmentWriteKey + ': ').toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'track',
            event: 'Responsys Response Message Received',
            properties: {
              body,
              responsysRequest: {
                ...requestBody
              },
              recordCount: requestBody.recordData.records.length
            },
            anonymousId: '__responsys__API__response__'
          })
        }
      )
    } catch (error) {
      // do nothing
    }
  }
}

export const getAsyncResponse = async (
  requestId: string,
  authTokens: AuthTokens,
  settings: Settings
): Promise<ModifiedResponse<unknown>> => {
  const headers = {
    headers: {
      authorization: `${authTokens.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const operationResponseEndpoint = new URL(`/rest/asyncApi/v1.3/requests/${requestId}`, settings.baseUrl)
  const request = createRequestClient(headers)
  // Take a break.
  await new Promise((resolve) => setTimeout(resolve, getAsyncResponseWaitInterval))
  const asyncResponse = await request(operationResponseEndpoint.href, {
    method: 'GET',
    skipResponseCloning: true
  })

  return asyncResponse
}
