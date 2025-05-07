import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { createProfile, addProfileToList, processPhoneNumber, sendBatchedProfileImportJobRequest } from '../functions'
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
  phone_number,
  country_code
} from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add Profile to List',
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
    properties: { ...properties },
    country_code: { ...country_code },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['list_id']
    }
  },
  perform: async (request, { payload }) => {
    const {
      email,
      phone_number: initialPhoneNumber,
      list_id,
      external_id,
      enable_batching,
      batch_size,
      country_code,
      batch_keys,
      ...additionalAttributes
    } = payload
    const phone_number = processPhoneNumber(initialPhoneNumber, country_code)
    if (!email && !external_id && !phone_number) {
      throw new PayloadValidationError('One of External ID, Phone Number and Email is required.')
    }
    const profileId = await createProfile(request, email, external_id, phone_number, additionalAttributes)
    return await addProfileToList(request, profileId, list_id)
  },
  performBatch: async (request, { payload, statsContext }) => {
    return sendBatchedProfileImportJobRequest(request, payload, statsContext)
  }
}

export default action
