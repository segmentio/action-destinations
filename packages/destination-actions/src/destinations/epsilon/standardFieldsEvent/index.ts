import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { standardFields } from '../fields'
import { URL } from '../constants'
import { EpsilonPayload, BaseEventData } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Standard Fields Event',
  description: 'Sync an event containing standard fields only to Epsilon',
  defaultSubscription: 'type = "track"',
  fields: {
    ...standardFields
  },
  perform: (request, {payload, settings}) => {

    const {
      id,
      appId,
      dtm_event,
      version,
      dtm_fid,
      dtm_promo_id,
      deviceType,
      identifiers: {
        deviceID,
        advertisingId,
        dtm_user_agent,
        dtm_user_ip,
        dtm_email_hash,
        dtm_mobile_hash,
        dtm_user_id
      } = {},
    } = payload

    const {
      dtm_cid,
      siteId
    } = settings 

    const eventData: BaseEventData = {
        dtm_cid,
        dtm_cmagic: dtm_cid.substring(0, 5),
        dtm_fid,
        dtm_promo_id,
        idfa: deviceType === 'ios' ? advertisingId : undefined,
        google_play_id: deviceType === 'android' ? advertisingId : undefined,
        idfv: deviceType === 'ios' ? deviceID : undefined,
        google_app_set_id: deviceType === 'android' ? deviceID : undefined,
        dtm_user_agent,
        dtm_user_ip,
        dtm_email_hash,
        dtm_mobile_hash,
        dtm_user_id
    }

    const json: EpsilonPayload = {
      id, 
      jsonrpc: '2.0',
      method: 'syncEvent',
      params: {
        appId,
        dtm_event,
        version,
        eventData
      }
    }

    return request(URL, {
      method: 'post',
      json
    })
  }
}

export default action
