import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createCustomAttrbute, fetchAllAttributes } from './utils'
import { personalizeAttributes, Data } from './types'
import { PERSONALIZE_EDGE_API_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Attributes Sync',
  description:
    'This action is used to sync custom attributes to your contentstack experience, and is only compatible with Identify events.',
  defaultSubscription: 'type = "identify"',
  fields: {},
  perform: async (request, data) => {
    const d = data as Data

    const { rawData } = d
    const customTraitsOfSegment = Object.keys(rawData?.traits || {})

    const personalizeAttributesData = (await fetchAllAttributes(request)).map(
      (attribute: personalizeAttributes) => attribute?.key
    )

    const attributesToCreate = customTraitsOfSegment.filter(
      (trait: string) => !personalizeAttributesData.includes(trait)
    )

    if (attributesToCreate?.length) {
      const firstAttributeRes = await createCustomAttrbute(request, attributesToCreate[0])
      if (firstAttributeRes.status === 401) return firstAttributeRes

      const otherAttributes = attributesToCreate.slice(1)

      await Promise.allSettled(otherAttributes.map((trait: string) => createCustomAttrbute(request, trait)))

      return request(`${PERSONALIZE_EDGE_API_URL}/user-attributes`, {
        method: 'patch',
        json: rawData?.traits,
        headers: {
          'x-cs-eclipse-user-uid': rawData?.userId || ''
        }
      })
    }
  }
}

export default action
