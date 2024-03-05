import { ActionDefinition, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { createProfile, addProfileToList, createImportJobPayload, sendImportJobRequest } from '../functions'
import { email, external_id, list_id, enable_batching, batch_size } from '../properties'
import { KlaviyoAPIError } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Profile To List',
  description: 'Add Profile To List',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    email: { ...email },
    list_id: { ...list_id },
    external_id: { ...external_id },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size }
  },
  perform: async (request, { payload }) => {
    const { email, list_id, external_id } = payload
    if (!email && !external_id) {
      throw new PayloadValidationError('One of Email or External Id is required')
    }

    try {
      const profileId = await createProfile(request, email, external_id)
      return await addProfileToList(request, profileId, list_id)
    } catch (error: unknown) {
      const apiError = error as { errors: KlaviyoAPIError }

      if (apiError.errors && Array.isArray(apiError.errors)) {
        const detailedError = apiError.errors[0]
        const errorMessage = detailedError.detail || 'An error occurred while processing the request.'
        throw new IntegrationError(errorMessage, detailedError.code || 'UNEXPECTED_ERROR', detailedError.status || 500)
      } else {
        throw error
      }
    }
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
