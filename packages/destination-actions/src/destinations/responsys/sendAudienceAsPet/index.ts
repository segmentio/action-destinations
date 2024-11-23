import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateListMemberPayload } from '../utils'
import { createPet, petExists, updateProfileListAndPet } from './functions'
import { recipient_data, retry } from '../shared-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Audience as PET (Profile Extension Table)',
  description: 'Send Engage Audience to a separate, newly created Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    userData: recipient_data,
    folder_name: {
      label: 'Folder Name',
      description:
        'The name of the folder where the new Profile Extension Table will be created. Overrides the default folder name in Settings.',
      type: 'string',
      required: false,
      default: 'Segment'
    },
    pet_name: {
      label: 'Profile Extension Table Name',
      description: 'The PET (Profile Extension Table) name. The default value is the audience key in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    computation_key: {
      label: 'Segment Audience Key',
      description: 'A unique identifier assigned to a specific audience in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Hidden field used to access traits or properties objects from Engage payloads.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: false,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    retry: retry
  },
  // https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-listextensions-petname-members-post.html
  perform: async (request, data) => {
    const { payload, settings } = data
    validateListMemberPayload(payload.userData)

    const petAlreadyExists = await petExists(request, settings, payload.pet_name)
    if (!petAlreadyExists) {
      await createPet(request, settings, payload)
    }

    return await updateProfileListAndPet(request, settings, [payload])
  },
  // https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-listextensions-petname-members-post.html
  performBatch: async (request, data) => {
    const { payload, settings } = data

    const validPayloads = []
    for (const item of payload) {
      try {
        validateListMemberPayload(item.userData)
        validPayloads.push(item)
      } catch (error) {
        console.error(error)
      }
    }

    // Can we consider that each batch has only one audience key?
    const petAlreadyExists = await petExists(request, settings, payload[0].pet_name)
    if (!petAlreadyExists) {
      await createPet(request, settings, payload[0])
    }

    return await updateProfileListAndPet(request, settings, payload)
  }
}

export default action
