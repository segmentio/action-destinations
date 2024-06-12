import type { RequestClient } from '@segment/actions-core'
import { PersonalizeAttributes } from './types'

export const createCustomAttrbute = async (request: RequestClient, name: string, url: string) =>
  request(`${url}/attributes`, {
    method: 'post',
    json: {
      name,
      key: name,
      description: `Segment ${name}`
    }
  })

export const fetchAllAttributes = async (request: RequestClient, url: string) => {
  const res = await request(`${url}/attributes`, {
    method: 'get'
  })

  return res.data as PersonalizeAttributes[]
}
