import type { RequestClient } from '@segment/actions-core'
import { PersonalizeAttributes, AttributesResponse } from './types'

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

export const createBackupAudiencesForTraits = async (
  request: RequestClient,
  allAttributes: AttributesResponse[],
  url: string
) =>
  Promise.all(
    allAttributes.map((attribute) =>
      request(`${url}/audiences`, {
        method: 'post',
        json: {
          name: `${attribute.name} audience`,
          description: `Segment ${attribute.name} audience`,
          definition: {
            __type: 'RuleCombination',
            combinationType: 'AND',
            rules: [
              {
                __type: 'Rule',
                attribute: {
                  __type: 'UserAttributeReference',
                  ref: attribute.uid
                },
                attributeMatchCondition: 'HAS_ANY_VALUE',
                invertCondition: false
              }
            ]
          }
        }
      })
    )
  )
