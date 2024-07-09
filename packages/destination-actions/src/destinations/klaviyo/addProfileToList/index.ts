import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { createProfile, addProfileToList, createImportJobPayload, sendImportJobRequest } from '../functions'
import {
  email,
  external_id,
  list_id,
  enable_batching,
  batch_size,
  first_name,
  last_name,
  organization,
  title,
  image,
  location,
  properties
} from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Profile to List (Engage)',
  description: 'Add Profile To List',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    email: { ...email },
    list_id: { ...list_id },
    external_id: { ...external_id },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size },
    first_name: { ...first_name },
    last_name: { ...last_name },
    image: { ...image },
    title: { ...title },
    organization: { ...organization },
    location: { ...location },
    properties: { ...properties }
  },
  perform: async (request, { payload }) => {
    const { email, list_id, external_id, enable_batching, batch_size, ...additionalAttributes } = payload
    if (!email && !external_id) {
      throw new PayloadValidationError('One of Email or External Id is required')
    }
    const profileId = await createProfile(request, email, external_id, additionalAttributes)
    return await addProfileToList(request, profileId, list_id)
  },
  performBatch: async (request, { payload }) => {
    // Filtering out profiles that do not contain either an email or external_id.
    payload = payload.filter((profile) => profile.email || profile.external_id)
    const listId = payload[0]?.list_id
    const importJobPayload = createImportJobPayload(payload, listId)
    return sendImportJobRequest(request, importJobPayload)
  }
}

export default action
