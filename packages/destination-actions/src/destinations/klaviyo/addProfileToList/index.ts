import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { KlaviyoAPIError, listData } from '../types'
import { createProfile, executeProfileList } from '../functions'
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
      throw new IntegrationError('Missing List Id', 'Missing required fields', 400)
    }
    const listData: listData = {
      data: [
        {
          type: 'profile'
        }
      ]
    }

    try {
      const profileData = await createProfile(request, email)
      const id = JSON.parse(profileData?.content)?.data?.id

      if (id) {
        listData.data[0].id = id
        return await executeProfileList(request, 'POST', listData, external_id)
      }
    } catch (error) {
      const { response } = error as KlaviyoAPIError

      if (response?.status === 409) {
        const content = JSON.parse(response?.content)
        const id = content?.errors[0]?.meta?.duplicate_profile_id

        if (id) {
          listData.data[0].id = id

          return await executeProfileList(request, 'POST', listData, external_id)
        }
      }
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
