import { ActionDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'
import {
  event_name,
  send_email,
  send_phone,
  send_advertising_id,
  email,
  phone,
  advertising_id,
  enable_batching,
  external_audience_id
} from '../properties'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience',
  description: 'Sync an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name,
    send_email,
    send_phone,
    send_advertising_id,
    email,
    phone,
    advertising_id,
    enable_batching,
    external_audience_id,
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      multiple: true,
      default: ['send_email', 'send_phone', 'send_advertising_id', 'external_audience_id'],
      unsafe_hidden: true
    }
  },
  perform: async (request, { audienceSettings, payload, audienceMembership }) => {
    return send(request, [payload], audienceSettings, [audienceMembership])
  },
  performBatch: async (request, { payload: payloads, audienceSettings, audienceMembership: audienceMemberships }) => {
    return send(request, payloads, audienceSettings, audienceMemberships, true)
  }
}

export default action
