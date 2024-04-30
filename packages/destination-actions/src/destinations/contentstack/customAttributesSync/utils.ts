import type { RequestClient } from '@segment/actions-core'
import { personalizeAttributes } from './types'
import { PERSONALIZE_API_BASE_URL } from '../constants'

export const createCustomAttrbute = async (
  request: RequestClient,
  name: string,
  orgId: string,
  projectId: string,
  accessToken: string
) =>
  request(`${PERSONALIZE_API_BASE_URL}/attributes`, {
    method: 'post',
    json: {
      name,
      key: name,
      description: `Segment ${name}`
    },
    headers: {
      'x-project-uid': projectId,
      Authorization: `Bearer ${accessToken}`,
      organization_uid: orgId
    }
  })

export const fetchAllAttributes = async (
  request: RequestClient,
  orgId: string,
  projectId: string,
  accessToken: string
) => {
  const res = await request(`${PERSONALIZE_API_BASE_URL}/attributes`, {
    method: 'get',
    headers: {
      'x-project-uid': projectId,
      Authorization: `Bearer ${accessToken}`,
      organization_uid: orgId
    }
  })

  return res.data as personalizeAttributes[]
}
