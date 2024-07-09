import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { getProfiles, removeProfileFromList } from '../functions'
import { email, list_id, external_id, enable_batching } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove Profile from List (Engage)',
  description: 'Remove profile from list',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    email: { ...email },
    external_id: { ...external_id },
    list_id: { ...list_id },
    enable_batching: { ...enable_batching }
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
