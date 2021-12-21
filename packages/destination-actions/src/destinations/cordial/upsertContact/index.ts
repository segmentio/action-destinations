import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Contact',
  description: 'Upsert Cordial Contact from Segment\'s identify events',
  defaultSubscription: 'type = "identify"',
  fields: {
    identifyByKey: {
      label: 'Contact IdentifyBy key',
      description: 'Property key by which Cordial contact should be identified. May be any primary or secondary key (e.g. cID, email, segment_id etc.)',
      type: 'string',
      required: true,
    },
    identifyByValue: {
      label: 'Contact IdentifyBy value',
      description: 'Value for defined key',
      type: 'string',
      required: true,
    },
  },
  perform: (request, { settings, payload }) => {
    return request(`${settings.endpoint}/v2/contacts`, {
      method: 'post',
      json: {
        [payload.identifyByKey]: payload.identifyByValue,
        identifyBy: [payload.identifyByKey],
        request_source: "integration-segment"
      }
    });
  }
}

export default action
