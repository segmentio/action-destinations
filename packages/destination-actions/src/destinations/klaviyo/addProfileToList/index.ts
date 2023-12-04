import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { createProfile, addProfileToList, createImportJobPayload, sendImportJobRequest } from '../functions'
import { email, external_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Profile To List',
  description: 'Add Profile To List',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    email: { ...email },
    external_id: { ...external_id }
  },
  perform: async (request, { payload }) => {
    const { email, external_id } = payload
    if (!email) {
      throw new PayloadValidationError('Missing Email')
    }
    const profileId = await createProfile(request, email)
    return await addProfileToList(request, profileId, external_id)
  },
  performBatch: async (request, { payload }) => {
    payload = payload.filter((profile) => profile.email || profile.external_id)
    const listId = payload[0].external_id
    const importJobPayload = createImportJobPayload(payload, listId)
    return await sendImportJobRequest(request, importJobPayload)
  }
}

export default action
