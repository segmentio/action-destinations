import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import {
  createProfile,
  addProfileToList,
  createImportJobPayload,
  sendImportJobRequest,
  validatePhoneNumber
} from '../functions'
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
  properties,
  phone_number
} from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Profile to List (Engage)',
  description: 'Add Profile To List',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    email: { ...email },
    phone_number: { ...phone_number },
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
    const { email, phone_number, list_id, external_id, enable_batching, batch_size, ...additionalAttributes } = payload
    if (!email && !external_id && !phone_number) {
      throw new PayloadValidationError('One of External ID, Phone Number and Email is required.')
    }
    if (phone_number && !validatePhoneNumber(phone_number)) {
      throw new PayloadValidationError(`${phone_number} is not a valid E.164 phone number.`)
    }
    const profileId = await createProfile(request, email, external_id, phone_number, additionalAttributes)
    return await addProfileToList(request, profileId, list_id)
  },
  performBatch: async (request, { payload }) => {
    // Filtering out profiles that do not contain either an email, external_id or valid phone number.
    payload = payload.filter((profile) => {
      if (profile.phone_number && !validatePhoneNumber(profile.phone_number)) {
        return false
      }
      return profile.email || profile.external_id || profile.phone_number
    })
    const listId = payload[0]?.list_id
    const importJobPayload = createImportJobPayload(payload, listId)
    return sendImportJobRequest(request, importJobPayload)
  }
}

export default action
