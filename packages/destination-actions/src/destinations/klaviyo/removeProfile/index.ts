import { ActionDefinition, DynamicFieldResponse, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { getListIdDynamicData, getProfiles, removeProfileFromList } from '../functions'
import { enable_batching } from '../properties'

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
    enable_batching: { ...enable_batching }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, list_id, external_id } = payload
    if (!email && !external_id) {
      throw new PayloadValidationError('Missing Email or External Id')
    }
    const profileIds = await getProfiles(request, email ? [email] : undefined, external_id ? [external_id] : undefined)
    return await removeProfileFromList(request, profileIds, list_id)
  },
  performBatch: async (request, { payload }) => {
    // Filtering out profiles that do not contain either an email or external_id.
    const filteredPayload = payload.filter((profile) => profile.email || profile.external_id)
    const listId = filteredPayload[0]?.list_id
    const emails = filteredPayload.map((profile) => profile.email).filter((email) => email) as string[]
    const externalIds = filteredPayload
      .map((profile) => profile.external_id)
      .filter((external_id) => external_id) as string[]

    const profileIds = await getProfiles(request, emails, externalIds)
    return await removeProfileFromList(request, profileIds, listId)
  }
}

export default action
