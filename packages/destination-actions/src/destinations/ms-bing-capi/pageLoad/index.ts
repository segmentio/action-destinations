import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customData, data as pageLoadEvent, userData } from '../fields'
import { API_URL } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'
import { v4 as uuidv4 } from '@lukeed/uuid'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Load',
  description: 'Send a page load event to Microsoft Bing CAPI.',
  defaultSubscription: 'type = "page"',
  fields: {
    data: pageLoadEvent,
    userData: userData,
    customData: customData
  },
  perform: (request, { payload, settings }) => {
    if (payload.data.userData == undefined) {
      payload.data.userData = {
        anonymousId: uuidv4()
      }
    }
    if (payload.userData?.em) {
      payload.userData.em = processHashing(payload.userData.em, 'sha256', 'hex', (value) => value.trim().toLowerCase())
    }
    if (payload.userData?.ph) {
      payload.userData.ph = processHashing(payload.userData.ph, 'sha256', 'hex', (value) =>
        value.trim().replace(/\D/g, '')
      )
    }

    // Merge customData into data if available
    if (payload.customData) {
      payload.data.customData = payload.customData
    }
    // Merge userData into data if available
    if (payload.userData) {
      payload.data.userData = payload.userData
    }

    const url = `${API_URL}${settings.UetTag}/events`

    return request(url, {
      method: 'post',
      json: {
        data: [payload.data]
      }
    })
  }
}

export default action
