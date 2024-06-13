import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createCustomAttrbute, fetchAllAttributes } from './utils'
import { PersonalizeAttributes } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Attributes Sync',
  description: 'Sync Custom Attributes to your Contentstack Experience.',
  defaultSubscription: 'type = "identify"',
  fields: {
    traits: {
      type: 'object',
      default: { '@path': '$.traits' },
      label: 'User traits',
      description: 'User Profile traits to send to Contentstack',
      required: true
    },
    userId: {
      type: 'string',
      default: { '@path': '$.userId' },
      label: 'User ID',
      description: 'ID for the user',
      required: false
    }
  },
  perform: async (request, { payload, settings }) => {
    const personalizeAttributesData = (await fetchAllAttributes(request, settings.personalizeApiBaseUrl)).map(
      (attribute: PersonalizeAttributes) => attribute?.key
    )

    const attributesToCreate = Object.keys(payload.traits || {}).filter(
      (trait: string) => !personalizeAttributesData.includes(trait)
    )

    if (attributesToCreate?.length) {
      const firstAttributeRes = await createCustomAttrbute(
        request,
        attributesToCreate[0],
        settings.personalizeApiBaseUrl
      )
      if (firstAttributeRes.status === 401) return firstAttributeRes

      const otherAttributes = attributesToCreate.slice(1)

      await Promise.allSettled(
        otherAttributes.map((trait: string) => createCustomAttrbute(request, trait, settings.personalizeApiBaseUrl))
      )

      return request(`${settings.personalizeEdgeApiBaseUrl}/user-attributes`, {
        method: 'patch',
        json: payload.traits,
        headers: {
          'x-cs-eclipse-user-uid': payload.userId ?? ''
        }
      })
    }
  }
}

export default action
