import { RequestClient } from '@segment/actions-core'

const DV360API = `https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences`

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  audienceType: string
  appId?: string
  token?: string
}

interface getAudienceParams {
  advertiserId: string
  audienceId: string
  token?: string
}

export const createAudienceRequest = (
  request: RequestClient,
  params: createAudienceRequestParams
): Promise<Response> => {
  const { advertiserId, audienceName, description, membershipDurationDays, audienceType, appId, token } = params

  const endpoint = DV360API + `?advertiserId=${advertiserId}`

  return request(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    json: {
      displayName: audienceName,
      audienceType: audienceType,
      membershipDurationDays: membershipDurationDays,
      description: description,
      audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
      firstAndThirdPartyAudienceType: 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY',
      appId: appId
    }
  })
}

export const getAudienceRequest = (request: RequestClient, params: getAudienceParams): Promise<Response> => {
  const { advertiserId, audienceId, token } = params

  const endpoint = DV360API + `/${audienceId}?advertiserId=${advertiserId}`

  return request(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
