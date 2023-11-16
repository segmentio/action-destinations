import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { addProfileToList, getProfile } from '../functions'
import { email, external_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove profile from list',
  description: 'Remove profile from list',
  fields: {
    email: { ...email },
    external_id: { ...external_id }
  },
  perform: async (request, { payload }) => {
    const { email, external_id } = payload
    if (!email || !external_id) {
      throw new PayloadValidationError('Missing Email or List Id')
    }
    try {
      const profileData = await getProfile(request, email)
      const v = profileData.content
      if (v && Object.keys(v).length !== 0) {
        return await addProfileToList(request, 'DELETE', v.data[0].id, external_id)
      }
      return
    } catch (error) {
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
