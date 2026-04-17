import { ActionDefinition, PayloadValidationError,  } from '@segment/actions-core'
import type { Settings, AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../functions'
import {
  email,
  advertising_id,
  phone,
  send_email,
  send_phone,
  send_advertising_id,
  event_name,
  enable_batching,
  external_audience_id
} from '../properties'
import { IntegrationError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience',
  description: 'Sync an Engage Audience to a TikTok Audience Segment.',
  defaultSubscription: 'type = "track"',
  fields: {
    email: { ...email },
    phone: { ...phone },
    advertising_id: { ...advertising_id },
    send_email: { ...send_email },
    send_phone: { ...send_phone },
    send_advertising_id: { ...send_advertising_id },
    event_name: { ...event_name },
    enable_batching: { ...enable_batching },
    external_audience_id: { ...external_audience_id }
  },
  perform: async (request, { audienceSettings, payload, statsContext, audienceMembership }) => {
    const statsClient = statsContext?.statsClient
    const statsTag = statsContext?.tags

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }

    let membership: 'add' | 'delete'

    if (audienceMembership === true) {
      statsClient?.incr('addToAudience', 1, statsTag)
      membership = 'add'
    } else if (audienceMembership === false) {
      statsClient?.incr('removeFromAudience', 1, statsTag)
      membership = 'delete'
    } else {
      throw new IntegrationError(
        'Bad Request: audienceMembership must be true or false.', 
        'INVALID_REQUEST_DATA', 
        400
      )
    }

    return processPayload(request, audienceSettings, [payload], membership)
  },
  performBatch: async (request, { payload, audienceSettings, statsContext, audienceMembership }) => {
    const statsClient = statsContext?.statsClient
    const statsTag = statsContext?.tags
    const addPayloads: Payload[] = []
    const deletePayloads: Payload[] = []  

    if (!audienceSettings) {
      throw new IntegrationError('Bad Request: no audienceSettings found.', 'INVALID_REQUEST_DATA', 400)
    }
    if(!Array.isArray(audienceMembership)){
      throw new PayloadValidationError('Audience Memberships must be an array')
    }
    if(audienceMembership.length !== payload.length){
      throw new PayloadValidationError('Audience Memberships length must match payloads length')
    }
    if (audienceMembership.some((membership) => typeof membership !== 'boolean')) {
      throw new PayloadValidationError('Audience Membership must be a boolean');
    }

    payload.forEach((p, i) => {
      const membership = audienceMembership[i]
      if (membership === true) {
        addPayloads.push(p)
      } else if (membership === false) {
        deletePayloads.push(p)
      } 
    })

    if (addPayloads && addPayloads.length > 0) {
      statsClient?.incr('addToAudience', 1, statsTag)
      await processPayload(request, audienceSettings, addPayloads, 'add')
    } 

    if (deletePayloads && deletePayloads.length > 0) {
      statsClient?.incr('removeFromAudience', 1, statsTag)
      await processPayload(request, audienceSettings, deletePayloads, 'delete')
    } 

    return {} // what to return here?
  }
}

export default action
