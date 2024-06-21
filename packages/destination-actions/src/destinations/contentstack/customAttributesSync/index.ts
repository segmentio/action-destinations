import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createCustomAttrbute, fetchAllAttributes, createBackupAudiencesForTraits } from './utils'
import { AttributesResponse, PersonalizeAttributes } from './types'
import { getNewAuth } from '../utils'
import { PERSONALIZE_APIS, PERSONALIZE_EDGE_APIS } from '../constants'

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
  perform: async (request, { payload, auth, settings }) => {
    const newAuth = getNewAuth(auth?.accessToken as string)
    const personalizeAttributesData = (await fetchAllAttributes(request, PERSONALIZE_APIS[newAuth.location])).map(
      (attribute: PersonalizeAttributes) => attribute?.key
    )

    const attributesToCreate = Object.keys(payload.traits || {}).filter(
      (trait: string) => !personalizeAttributesData.includes(trait)
    )

    if (attributesToCreate?.length) {
      const firstAttributeRes = await createCustomAttrbute(
        request,
        attributesToCreate[0],
        PERSONALIZE_APIS[newAuth.location]
      )
      if (firstAttributeRes.status === 401) return firstAttributeRes

      const otherAttributes = attributesToCreate.slice(1)

      const attributesRes = await Promise.all(
        otherAttributes.map((trait: string) => createCustomAttrbute(request, trait, PERSONALIZE_APIS[newAuth.location]))
      )

      const allAttributes = [
        firstAttributeRes.data,
        ...attributesRes.map((attrs) => attrs.data)
      ] as AttributesResponse[]

      if (settings.createBackupAudience)
        await createBackupAudiencesForTraits(request, allAttributes, PERSONALIZE_APIS[newAuth.location])

      return request(`${PERSONALIZE_EDGE_APIS[newAuth.location]}/user-attributes`, {
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
