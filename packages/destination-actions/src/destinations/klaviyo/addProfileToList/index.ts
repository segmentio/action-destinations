import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { createProfile, addProfileToList, createImportJobPayload, sendImportJobRequest } from '../functions'
import { email, external_id, list_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Profile To List',
  description: 'Add Profile To List',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    email: { ...email },
    list_id: { ...list_id },
    external_id: { ...external_id }
  },
  perform: async (request, { payload }) => {
    const { email, list_id, external_id } = payload
    if (!email && !external_id) {
      throw new PayloadValidationError('One of Email or External Id is required')
    }
    const profileId = await createProfile(request, email, external_id)
    return await addProfileToList(request, profileId, list_id)
  },
  performBatch: async (request, { payload }) => {
    payload = payload.filter((profile) => profile.email || profile.external_id)
    const listId = payload[0]?.list_id
    const importJobPayload = createImportJobPayload(payload, listId)
    return sendImportJobRequest(request, importJobPayload)
  }
}

export default action
