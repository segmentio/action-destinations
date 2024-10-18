import { ActionDefinition, DynamicFieldResponse, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import {
  getListIdDynamicData,
  getProfiles,
  processPhoneNumber,
  removeProfileFromList,
  validateAndConvertPhoneNumber
} from '../functions'
import { country_code, enable_batching } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Profile',
  description: 'Remove profile from list',
  defaultSubscription: 'event = "Identify"',
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
    phone_number: {
      label: 'Phone Number',
      description: `Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.`,
      type: 'string',
      default: { '@path': '$.traits.phone' }
    },
    country_code: {
      ...country_code
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
    return await removeProfileFromList(request, profileIds, list_id)
  },
  performBatch: async (request, { payload }) => {
    // Filtering out profiles that do not contain either an email, valid phone_number or external_id.
    const filteredPayload = payload.filter((profile) => {
      // Validate and convert the phone number using the provided country code
      const validPhoneNumber = validateAndConvertPhoneNumber(profile.phone_number, profile.country_code)

      // If the phone number is valid, update the profile's phone number with the validated format
      if (validPhoneNumber) {
        profile.phone_number = validPhoneNumber
      }
      // If the phone number is invalid (null), exclude this profile
      else if (validPhoneNumber === null) {
        return false
      }
      return profile.email || profile.external_id || profile.phone_number
    })
    const listId = filteredPayload[0]?.list_id
    const emails = filteredPayload.map((profile) => profile.email).filter((email) => email) as string[]
    const externalIds = filteredPayload
      .map((profile) => profile.external_id)
      .filter((external_id) => external_id) as string[]
    const phoneNumbers = filteredPayload
      .map((profile) => profile.phone_number)
      .filter((phone_number) => phone_number) as string[]

    const profileIds = await getProfiles(request, emails, externalIds, phoneNumbers)
    return await removeProfileFromList(request, profileIds, listId)
  }
}

export default action
