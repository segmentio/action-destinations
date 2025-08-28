import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { data } from '../fields'
import { API_URL } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'
import { v4 as uuidv4 } from '@lukeed/uuid'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event',
  description: '',
  defaultSubscription: 'type = "track"',
  fields: {
    data: data
  },
  perform: (request, { payload, settings }) => {
    if (payload.data.userData == undefined) {
      payload.data.userData = {
        anonymousId: uuidv4()
      }
    }
    if (payload.data.userData?.em) {
      payload.data.userData.em = processHashing(payload.data.userData.em, 'sha256', 'hex', (value) =>
        value.trim().toLowerCase()
      )
    }
    if (payload.data.userData?.ph) {
      payload.data.userData.ph = processHashing(payload.data.userData.ph, 'sha256', 'hex', (value) =>
        value.trim().replace(/\D/g, '')
      )
    }

    return request(`${API_URL}${settings.UetTag}/events`, {
      method: 'post',
      json: {
        data: [payload.data]
      }
    })
  }
}

export default action
