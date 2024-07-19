import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SingleUpdateRequestData, UpsertUserPayload } from '../types'
import { CONSTANTS } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
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
      description: "Specify additional traits or identifiers to sync to Iterable. You will need to ensure these traits or obects are included via Event Settings >> Customized Setup.",
      required: false,
      type: 'string',
      multiple: true
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
    }
  },
  perform: (request, { payload, settings, audienceSettings }) => {
    
    
    const payload = data.payload as { email: string; user_id: string; data_fields: Record<string, unknown> }
    const rawData = (data as unknown as SingleUpdateRequestData).rawData
    const iterablePayload = processPayload(payload, rawData)

    const listId = iterablePayload.listId
    delete iterablePayload.listId

    const action = iterablePayload.action === 'subscribe' ? 'subscribe' : 'unsubscribe'
    delete iterablePayload.action

    return request(`${CONSTANTS.API_BASE_URL}/lists/${action}`, {
      method: 'post',
      json: {
        listId: listId,
        subscribers: [iterablePayload],
        updateExistingUsersOnly: false
      }
    })
  },
  performBatch: (request, { payload }) => {
    const iterablePayloads: { [key: number]: UpsertUserPayload[] } = {}

    for (const singlePayload of payload) {
      const singleUpdateRequestData = singlePayload as unknown as SingleUpdateRequestData
      const processedPayload = processPayload(
        singlePayload as { email: string; user_id: string; data_fields: Record<string, unknown> },
        singleUpdateRequestData.rawData
      )
      if (processedPayload.listId) {
        if (!(processedPayload.listId in iterablePayloads)) {
          iterablePayloads[processedPayload.listId] = []
        }

        iterablePayloads[processedPayload.listId].push(processedPayload)
      }
    }

    const promises = []
    for (const [listId, payloads] of Object.entries(iterablePayloads)) {
      const action = payloads[0].action === 'subscribe' ? 'subscribe' : 'unsubscribe'
      delete payloads[0].action

      promises.push(
        request(`${CONSTANTS.API_BASE_URL}/lists/${action}`, {
          method: 'post',
          json: {
            listId: Number(listId),
            subscribers: payloads,
            updateExistingUsersOnly: false
          }
        })
      )
    }

    return processBatch(promises)
  }
}

const processBatch = async (promises: Promise<unknown>[]) => await Promise.all(promises)

export default action
