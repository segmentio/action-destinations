import { RequestClient } from '@segment/actions-core'

const DV360API = `https://displayvideo.googleapis.com/v3/firstAndThirdPartyAudiences`

interface createAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  audienceType: string
  token?: string
}

interface getAudienceParams {
  advertiserId: string
  audienceId: string
  token?: string
}

export const createAudienceRequest = (
  _request: RequestClient,
  params: createAudienceRequestParams
): Promise<Response> => {
  const { advertiserId, audienceName, description, membershipDurationDays, audienceType, token } = params

  const endpoint = DV360API + `?advertiserId=${advertiserId}`

  return _request(endpoint, {
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
      firstAndThirdPartyAudienceType: 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY'
    }
  })
}

export const getAudienceRequest = (_request: RequestClient, params: getAudienceParams): Promise<Response> => {
  const { advertiserId, audienceId, token } = params

  const endpoint = DV360API + `/${audienceId}?advertiserId=${advertiserId}`

  return _request(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
