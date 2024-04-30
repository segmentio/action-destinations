import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createCustomAttrbute, fetchAllAttributes } from './utils'
import { personalizeAttributes, Data } from './types'
import { PERSONALIZE_EDGE_API_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Attributes Sync',
  description: 'This action destination is used to sync custom attributes to your contentstack experience',
  defaultSubscription: 'type = "identify"',
  fields: {},
  perform: async (request, data) => {
    const d = data as Data

    const { settings, rawData, auth } = d
    const customTraitsOfSegment = Object.keys(rawData?.traits || {})

    const personalizeAttributesData = (
      await fetchAllAttributes(request, settings.orgId, settings.personalizeProjectId, auth?.accessToken || '')
    ).map((attribute: personalizeAttributes) => attribute.key)

    const attributesToCreate = customTraitsOfSegment.filter(
      (trait: string) => !personalizeAttributesData.includes(trait)
    )

    if (attributesToCreate.length) {
      const firstAttributeRes = await createCustomAttrbute(
        request,
        attributesToCreate[0],
        settings.orgId,
        settings.personalizeProjectId,
        auth?.accessToken || ''
      )
      if (firstAttributeRes.status === 401) return firstAttributeRes

      const otherAttributes = attributesToCreate.slice(1)

      await Promise.allSettled(
        otherAttributes.map((trait: string) =>
          createCustomAttrbute(request, trait, settings.orgId, settings.personalizeProjectId, auth?.accessToken || '')
        )
      )

      return request(`${PERSONALIZE_EDGE_API_URL}/user-attributes`, {
        method: 'patch',
        json: rawData?.traits,
        headers: {
          'x-project-uid': settings.personalizeProjectId,
          'x-cs-eclipse-user-uid': rawData?.userId || '',
          Authorization: `Bearer ${auth?.accessToken}`,
          organization_uid: settings.orgId
        }
      })
    }
  }
}

export default action
