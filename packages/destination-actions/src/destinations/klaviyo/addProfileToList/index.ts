import { APIError, ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { createProfile, addProfileToList } from '../functions'
import { email, external_id } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add To List',
  description: 'Add to list',
  fields: {
    email: { ...email },
    external_id: { ...external_id }
  },
  perform: async (request, { payload }) => {
    const { email, external_id } = payload
    if (!external_id || !email) {
      throw new PayloadValidationError('Missing Email or List Id')
    }

    try {
      const profileData = await createProfile(request, email)
      const id = profileData?.data?.id
      return await addProfileToList(request, 'POST', id, external_id)
    } catch (error) {
      throw new APIError('An error occured while adding profile to list', 400)
    }
  }
}

export default action
