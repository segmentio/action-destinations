import { Payload as CustomTraitsPayload } from './sendCustomTraits/generated-types'
import { Payload as AudiencePayload } from './sendAudience/generated-types'
import { Payload as ListMemberPayload } from './upsertListMember/generated-types'

import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import {
  ResponsysRecordData,
  ResponsysCustomTraitsRequestBody,
  ResponsysMergeRule,
  ResponsysListMemberRequestBody,
  Data,
  ResponsysAsyncResponse
} from './types'
import {
  RequestClient,
  PayloadValidationError,
  RetryableError,
  StatsContext,
  ModifiedResponse,
  createRequestClient
} from '@segment/actions-core'
import type { Settings } from './generated-types'

// Rate limits per endpoint.
// Can be obtained through `/rest/api/ratelimit`, but at the point
// this project is, there's no good way to calling it without a huge
// drop in performance.
// We are using here the most common values observed in our customers.

// upsertListMembers (`lists/${settings.profileListName}/members`, POST): 400 requests per minute.
// Around 1 request every 150ms.
const upsertListMembersWaitInterval = 150

// getAsyncResponse (`requests/${requestId}`, GET): 1000 requests per minute.
// Around 1 request every 60ms.
const getAsyncResponseWaitInterval = 60

export const getRateLimits = async (request: RequestClient, settings: Settings): Promise<ModifiedResponse<any>> => {
  const endpoint = new URL('/rest/api/ratelimit', settings.baseUrl)
  return request(endpoint.href, {
    method: 'GET',
    skipResponseCloning: true
  })
}

export const testConditionsToRetry = ({
  timestamp,
  statsContext,
  retry
}: {
  profileExtensionTable?: string
  timestamp: string | number
  statsContext: StatsContext | undefined
  retry?: number
}): void => {
  const statsClient = statsContext?.statsClient
  const statsTag = statsContext?.tags
  if (retry !== undefined && retry > 0 && shouldRetry(timestamp, retry)) {
    if (statsClient && statsTag) {
      statsClient?.incr('responsysShouldRetryTRUE', 1, statsTag)
    }
    throw new RetryableError('Event timestamp is within the retry window. Artificial delay to retry this event.', 429)
  } else {
    if (statsClient && statsTag) {
      statsClient?.incr('responsysShouldRetryFALSE', 1, statsTag)
    }
  }
}

export const shouldRetry = (timestamp: string | number, retry: number): boolean => {
  return (new Date().getTime() - new Date(timestamp).getTime()) / 1000 < retry
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

export const getUserDataFieldNames = (data: Data): string[] => {
  return Object.keys((data as unknown as Data).rawMapping.userData)
}

export const stringifyObject = (obj: Record<string, unknown>): Record<string, string> => {
  const stringifiedObj: Record<string, string> = {}
  for (const key in obj) {
    stringifiedObj[key] = typeof obj[key] !== 'string' ? JSON.stringify(obj[key]) : (obj[key] as string)
  }
  return stringifiedObj
}

export const sendCustomTraits = async (
  request: RequestClient,
  payload: CustomTraitsPayload[] | AudiencePayload[],
  settings: Settings,
  userDataFieldNames: string[],
  isAudience = false
) => {
  let userDataArray: unknown[]
  if (isAudience) {
    const audiencePayloads = payload as AudiencePayload[]
    userDataArray = audiencePayloads.map((obj) => {
      const audienceKeyUppercase = obj.computation_key.toUpperCase()
      const audienceTraitValue = { [audienceKeyUppercase]: obj.traits_or_props[obj.computation_key] }

      if (!userDataFieldNames.includes(audienceKeyUppercase)) {
        userDataFieldNames.push(audienceKeyUppercase)
      }

      return {
        ...(obj.stringify ? stringifyObject(obj.userData) : obj.userData),
        ...(obj.stringify ? stringifyObject(audienceTraitValue) : audienceTraitValue)
      }
    })
  } else {
    const customTraitsPayloads = payload as CustomTraitsPayload[]
    userDataArray = customTraitsPayloads.map((obj) => (obj.stringify ? stringifyObject(obj.userData) : obj.userData))
  }

  const records: string[][] = userDataArray.map((userData) => {
    return userDataFieldNames.map((fieldName) => {
      return (userData as Record<string, string>) && fieldName in (userData as Record<string, string>)
        ? (userData as Record<string, string>)[fieldName]
        : ''
    })
  })

  const recordData: ResponsysRecordData = {
    fieldNames: userDataFieldNames.map((field) => field.toUpperCase()),
    records,
    mapTemplateName: ''
  }

  const requestBody: ResponsysCustomTraitsRequestBody = {
    recordData,
    insertOnNoMatch: settings.insertOnNoMatch,
    updateOnMatch: settings.updateOnMatch,
    matchColumnName1: settings.matchColumnName1,
    matchColumnName2: settings.matchColumnName2 || ''
  }
  const path = `/rest/asyncApi/v1.3/lists/${settings.profileListName}/listExtensions/${settings.profileExtensionTable}/members`

  const endpoint = new URL(path, settings.baseUrl)

  const response = await request(endpoint.href, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  await sendDebugMessageToSegmentSource(request, requestBody, response, settings)
  return response
}

export const upsertListMembers = async (
  request: RequestClient,
  authTokens: AuthTokens,
  payload: ListMemberPayload[],
  settings: Settings,
  usingAsyncApi = true
) => {
  const userDataArray = payload.map((obj) => (obj.stringify ? stringifyObject(obj.userData) : obj.userData))
  const userDataFieldNames: string[] = [
    'EMAIL_ADDRESS_',
    'CUSTOMER_ID_',
    'MOBILE_NUMBER_',
    'EMAIL_MD5_HASH_',
    'EMAIL_SHA256_HASH_'
  ]

  const records: string[][] = []
  for (const item of userDataArray) {
    const record: string[] = []
    for (const fieldName of userDataFieldNames) {
      if (fieldName in item) {
        record.push((item as Record<string, string>)[fieldName])
      } else {
        record.push('')
      }
    }

    records.push(record)
  }

  const responses = []
  // Per https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/REST/Async/asyncApi-v1.3-lists-listName-members-post.htm,
  // we can only send 200 records at a time.
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200)
    const recordData: ResponsysRecordData = {
      fieldNames: userDataFieldNames,
      records: chunk,
      mapTemplateName: ''
    }

    const mergeRule: ResponsysMergeRule = {
      htmlValue: settings.htmlValue,
      optinValue: settings.optinValue,
      textValue: settings.textValue,
      insertOnNoMatch: settings.insertOnNoMatch || false,
      updateOnMatch: settings.updateOnMatch,
      matchColumnName1: settings.matchColumnName1 + '_',
      matchOperator: settings.matchOperator,
      optoutValue: settings.optoutValue,
      rejectRecordIfChannelEmpty: settings.rejectRecordIfChannelEmpty,
      defaultPermissionStatus: payload[0].default_permission_status || settings.defaultPermissionStatus
    }

    if (settings.matchColumnName2) {
      mergeRule.matchColumnName2 = settings.matchColumnName2 + '_'
    }

    const requestBody: ResponsysListMemberRequestBody = {
      recordData,
      mergeRule
    }

    const path = `/rest/${usingAsyncApi ? 'asyncApi' : 'api'}/v1.3/lists/${settings.profileListName}/members`
    const endpoint = new URL(path, settings.baseUrl)

    const headers = {
      headers: {
        authorization: `${authTokens.accessToken}`,
        'Content-Type': 'application/json'
      }
    }

    // Take a break.
    await new Promise((resolve) => setTimeout(resolve, upsertListMembersWaitInterval))

    const secondRequest = createRequestClient(headers)
    const response: ModifiedResponse<unknown> = await secondRequest(endpoint.href, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    // If request was done through Responsys Async API, we need to fetch the response from
    // another endpoint to get the real processing response.
    if (usingAsyncApi) {
      const requestId = (response as ModifiedResponse<ResponsysAsyncResponse>).data.requestId
      const asyncResponse = await getAsyncResponse(requestId, authTokens, settings)

      await sendDebugMessageToSegmentSource(request, requestBody, asyncResponse, settings)
      responses.push(asyncResponse)
    } else {
      await sendDebugMessageToSegmentSource(request, requestBody, response, settings)
      responses.push(response)
    }
  }

  return responses
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
                ...requestBody,
                recordCount: requestBody.recordData.records.length
              }
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
