import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { validateListMemberPayload } from '../utils'
import { createPet, petExists, updateProfileListAndPet } from './functions'
import { default_permission_status, recipient_data, retry } from '../shared-properties'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

// Rate limits per endpoint.
// Can be obtained through `/rest/api/ratelimit`, but at the point
// this project is, there's no good way to calling it without a huge
// drop in performance.
// We are using here the most common values observed in our customers.

// getAllPets (`lists/${settings.profileListName}/listExtensions`, GET): 1000 requests per minute.
// Around 1 request every 60ms.
const getAllPetsWaitInterval = 60

// createPet (`lists/${settings.profileListName}/listExtensions`, POST): 10 requests per minute.
// Around 1 request every 6000ms.
const createPetWaitInterval = 6000

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
    retry: retry,
    default_permission_status: default_permission_status
  },
  // https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-listextensions-petname-members-post.html
  perform: async (request, data) => {
    const { payload, settings, auth } = data
    validateListMemberPayload(payload.userData)

    await new Promise((resolve) => setTimeout(resolve, getAllPetsWaitInterval))
    const petAlreadyExists = await petExists(request, settings, payload.pet_name)
    if (!petAlreadyExists) {
      await new Promise((resolve) => setTimeout(resolve, createPetWaitInterval))
      await createPet(request, settings, payload)
    }

    return await updateProfileListAndPet(request, auth as AuthTokens, settings, [payload])
  },
  // https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-listextensions-petname-members-post.html
  performBatch: async (request, data) => {
    const { payload, settings, auth } = data

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
    await new Promise((resolve) => setTimeout(resolve, getAllPetsWaitInterval))
    const petAlreadyExists = await petExists(request, settings, payload[0].pet_name)
    if (!petAlreadyExists) {
      await new Promise((resolve) => setTimeout(resolve, createPetWaitInterval))
      await createPet(request, settings, payload[0])
    }

    return await updateProfileListAndPet(request, auth as AuthTokens, settings, payload)
  }
}

export default action
