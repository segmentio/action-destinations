import { ActionDefinition, DynamicFieldResponse, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import {
  getListIdDynamicData,
  getProfiles,
  processPhoneNumber,
  removeBulkProfilesFromList,
  removeProfileFromList
} from '../functions'
import { batch_size, country_code, enable_batching } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Profile',
  description: 'Remove profile from list',
  defaultSubscription: 'type = "Identify"',
  fields: {
    email: {
      label: 'Email',
      description: `Individual's email address. One of External ID, or Email required.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    external_id: {
      label: 'External ID',
      description: `A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system. One of External ID, Phone Number and Email required.`,
      type: 'string'
    },
    list_id: {
      label: 'List',
      description: `The Klaviyo list to add the profile to.`,
      type: 'string',
      dynamic: true,
      required: true
    },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size, default: 1000 },
    phone_number: {
      label: 'Phone Number',
      description: `Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.`,
      type: 'string',
      default: { '@path': '$.traits.phone' }
    },
    country_code: {
      ...country_code
    },
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
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
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
    if (!profileIds?.length) {
      throw new PayloadValidationError('No profiles found for the provided identifiers.')
    }
    return await removeProfileFromList(request, profileIds, list_id)
  },
  performBatch: async (request, { payload, statsContext }) => {
    return await removeBulkProfilesFromList(request, payload, statsContext)
  }
}

export default action
