import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { getProfile, removeProfileFromList } from '../functions'
import { email, external_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove profile from list',
  description: 'Remove profile from list',
  defaultSubscription: 'event = "Audience Exited"',
  fields: {
    email: { ...email },
    external_id: { ...external_id }
  },
  perform: async (request, { payload }) => {
    const { email, external_id } = payload
    if (!email) {
      throw new PayloadValidationError('Missing Email')
    }
    const profileData = await getProfile(request, email)
    const v = profileData.data
    if (v && v.length !== 0) {
      return await removeProfileFromList(request, v[0].id, external_id)
    }
  }
}

export default action
