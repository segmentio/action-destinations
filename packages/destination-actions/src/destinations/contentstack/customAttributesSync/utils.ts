import type { RequestClient } from '@segment/actions-core'
import { PersonalizeAttributes } from './types'
import { PERSONALIZE_API_BASE_URL } from '../constants'

export const createCustomAttrbute = async (request: RequestClient, name: string) =>
  request(`${PERSONALIZE_API_BASE_URL}/attributes`, {
    method: 'post',
    json: {
      name,
      key: name,
      description: `Segment ${name}`
    }
  })

export const fetchAllAttributes = async (request: RequestClient) => {
  const res = await request(`${PERSONALIZE_API_BASE_URL}/attributes`, {
    method: 'get'
  })

  return res.data as PersonalizeAttributes[]
}
