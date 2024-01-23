import { RequestOptions } from '@segment/actions-core/request-client'
import { ModifiedResponse } from '@segment/actions-core/types'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { ExecuteInput } from '@segment/actions-core/destination-kit'

const FIXME = <T>(): T => {
  throw new Error('UNIMPLEMENTED')
}

const formatPayload = (_payload: Payload, isTest = true): object => {
  // consider using the  message_id, though we already have client_dedup_id
  return {
    data: [
      {
        integration: isTest ? 'segment-capiV3-test' : 'segment',
        event_name: FIXME(),
        event_time: FIXME(),
        user_data: {},
        custom_data: {},
        event_source: FIXME(),
        action_source: FIXME()
      }
    ]
  }
}

export const performSnapCAPIv3 = async (
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>,
  data: ExecuteInput<Settings, Payload, any, any, any>,
  isTest = true
): Promise<ModifiedResponse<unknown>> => {
  // V3 URLs are templates
  //
  // (web) https://tr.snapchat.com/v3/{PIXEL_ID}/events?access_token={TOKEN}
  // (app) https://tr.snapchat.com/v3/{SNAP_APP_ID}/events?access_token={TOKEN}
  const url: string = FIXME()

  const payload = formatPayload(data.payload, isTest)

  return request(url, {
    method: 'post',
    json: payload
  })
}
