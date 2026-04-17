import { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import {
  email,
  advertising_id,
  phone,
  send_email,
  send_phone,
  send_advertising_id,
  event_name,
  enable_batching,
  batch_keys,
  external_audience_id
} from '../properties'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience',
  description: 'Sync an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'type = "track"',
  fields: {
    email,
    phone,
    advertising_id,
    send_email,
    send_phone,
    send_advertising_id,
    event_name,
    enable_batching,
    batch_keys: { ...batch_keys, type: 'string' as const },
    external_audience_id
  },
  perform: async (request, { audienceSettings, payload, audienceMembership }) => {
    return send(request, [payload], audienceSettings, [audienceMembership])
  },
  performBatch: async (request, { payload: payloads, audienceSettings, audienceMembership: audienceMemberships }) => {
    return send(request, payloads, audienceSettings, audienceMemberships, true)
  }
}

export default action
