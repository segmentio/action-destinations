import type { ActionDefinition } from '@segment/actions-core'
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
  title: 'Sync Audience [Beta]',
  description: 'Sync an Engage Audience to a TikTok Audience Segment. This action is currently in beta.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_name : { ...event_name},
    send_email : { ...send_email},
    send_phone : { ...send_phone},
    send_advertising_id : { ...send_advertising_id},
    email : { ...email},
    phone : { ...phone},
    advertising_id : { ...advertising_id},
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      multiple: true,
      default: ['send_email', 'send_phone', 'send_advertising_id'],
      unsafe_hidden: true
    }
  },
  perform: async (request, { audienceSettings, payload, audienceMembership, statsContext }) => {
    statsContext?.statsClient?.incr('syncAudience.single', 1, statsContext?.tags)
    return send(request, [payload], audienceSettings, [audienceMembership], false, statsContext)
  },
  performBatch: async (request, { payload: payloads, audienceSettings, audienceMembership: audienceMemberships, statsContext }) => {
    statsContext?.statsClient?.incr('syncAudience.batch', 1, statsContext?.tags)
    return send(request, payloads, audienceSettings, audienceMemberships, true, statsContext)
  }
}

export default action
