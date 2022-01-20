import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Profile',
  description: '',
  fields: {
    user_id: {
      label: 'User ID',
      description: "The user's unique identifier",
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, data) => {
    // TODO: check settings and change endpoint accordingly
    // MBOX Endpoint: http://CLIENT_KEY.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/USER_ID?client=CLIENT_KEY
    // PCID Endpoint: http://CLIENT_KEY.tt.omtrdc.net/rest/v1/profiles/USER_ID?client=CLIENT_KEY

    // if MBOX is id_type
    // COMES FROM SEGMENT
    // URL = target.adobe.com/MBOX/$ID

    // if id_type == PCID
    // COMES FROM THE CUSTOMER
    // URL = target.adobe.com/PCID/$ID

    console.log(request, data.payload)
  }
}

export default action
