import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { getProfile, removeProfileFromList } from '../functions'
import { email, list_id, external_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove profile from list',
  description: 'Remove profile from list',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    email: { ...email },
    external_id: { ...external_id },
    list_id: { ...list_id }
  },
  perform: async (request, { payload }) => {
    const { email, list_id, external_id } = payload
    if (!email && !external_id) {
      throw new PayloadValidationError('Missing Email or External Id')
    }
    const profileData = await getProfile(request, email, external_id)
    const v = profileData.data
    if (v && v.length !== 0) {
      return await removeProfileFromList(request, v[0].id, list_id)
    }
  }
}

export default action
