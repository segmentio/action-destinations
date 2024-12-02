import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { getProfiles, processPhoneNumber, removeBulkProfilesFromList, removeProfileFromList } from '../functions'
import { email, list_id, external_id, enable_batching, phone_number, country_code, batch_size } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Profile from List (Engage)',
  description: 'Remove profile from list',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    email: { ...email },
    external_id: { ...external_id },
    list_id: { ...list_id },
    phone_number: { ...phone_number },
    enable_batching: { ...enable_batching },
    country_code: { ...country_code },
    batch_size: { ...batch_size, default: 1000 }
  },
  perform: async (request, { payload }) => {
    const { email, list_id, external_id, phone_number: initialPhoneNumber, country_code } = payload
    const phone_number = processPhoneNumber(initialPhoneNumber, country_code)
    if (!email && !external_id && !phone_number) {
      throw new PayloadValidationError('One of External ID, Phone Number and Email is required.')
    }
    const profileIds = await getProfiles(
      request,
      email ? [email] : undefined,
      external_id ? [external_id] : undefined,
      phone_number ? [phone_number] : undefined
    )
    return await removeProfileFromList(request, profileIds, list_id)
  },
  performBatch: async (request, { payload }) => {
    return await removeBulkProfilesFromList(request, payload)
  }
}

export default action
