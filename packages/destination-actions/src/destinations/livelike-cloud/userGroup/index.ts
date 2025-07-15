import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'User Group',
  description: 'Add or remove a user profile from a User Group in Livelike. The User Group must already exist in Livelike.',
  fields: {

  },
  perform: (request, data) => {

    // This action will add or remove a user proile from a user group. It should work with Engage Audiences also. 



  }
}

export default action
