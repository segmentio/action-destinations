import { ActionDefinition, RequestClient } from '@segment/actions-core'

import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IterableListsClient } from './iterable-client'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync To Iterable Lists',
  description: 'Sync Segment Audience to Iterable Lists',
  fields: {
    email: {
      label: 'Email',
      description: 'Email address of the user',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    userId: {
      label: 'User ID',
      description: 'User ID',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    dataFields: {
      label: 'Additional traits or identifiers',
      description:
        'Additional traits or identifiers to sync to Iterable. You will need to ensure these traits or objects are included via Event Settings > Customized Setup.',
      required: false,
      type: 'object'
    },
    traitsOrProperties: {
      label: 'Traits or Properties',
      description: 'Traits or Properties object from the identify() or track() call emitted by Engage',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    segmentAudienceKey: {
      label: 'Segment Audience Key',
      description: 'Segment Audience Key. Maps to the Iterable List "Name" when the list is created in Iterable.',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segmentAudienceId: {
      label: 'Segment External Audience ID',
      description: 'Segment External Audience ID. Maps to the List ID when the list is created in Iterable.',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.external_audience_id'
      }
    }
  },
  perform: async (request, { payload, settings, audienceSettings }) => {
    IterableListsClient.validate(payload)
    await send(request, [payload], settings, audienceSettings)
  },
  performBatch: async (request, { payload, settings, audienceSettings }) => {
    await send(request, payload, settings, audienceSettings)
  }
}

const send = async (
  request: RequestClient,
  payload: Payload[],
  settings: Settings,
  audienceSettings?: AudienceSettings
) => {
  const client = new IterableListsClient(request, settings, audienceSettings)
  await client.processPayload(payload)
}

export default action
