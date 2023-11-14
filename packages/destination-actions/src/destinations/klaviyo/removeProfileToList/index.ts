import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

import { GetProfileResponseData, listData } from '../types'
import { executeProfileList, getProfile } from '../functions'
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
      throw new IntegrationError(
        "Insert the ID of the default list that you'd like to subscribe users",
        'Missing required fields',
        400
      )
    }
    try {
      const profileData: GetProfileResponseData = await getProfile(request, email)
      const v = JSON.parse(profileData.content)
      if (Object.keys(v).length !== 0) {
        const listData: listData = {
          data: [
            {
              type: 'profile',
              id: v.data[0].id
            }
          ]
        }

        const list = await executeProfileList(request, 'DELETE', listData, external_id)
        return list
      }
      return
    } catch (error) {
      console.log(error)
      throw new Error('An error occurred while processing the request')
    }
  }
}

export default action
