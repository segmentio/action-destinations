import { PayloadValidationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RawData, SingleUpdateRequestData, UpsertUserPayload } from '../types'
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
          else: { '@path': '$.context.traits.email' } // Phone is sent as identify's trait or track's context.trait
        }
      }
    },
    user_id: {
      label: 'User ID',
      description: 'User ID',
      type: 'string',
      unsafe_hidden: false,
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    data_fields: {
      label: 'Data Fields',
      description: 'Data fields to sync to Iterable Lists',
      type: 'object',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    }
  },
  perform: (request, data) => {
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

const processPayload = (
  payload: { email: string; user_id: string; data_fields: Record<string, unknown> },
  rawData: RawData
) => {
  if (!payload.email && !payload.user_id) {
    throw new PayloadValidationError('Must include email or user_id.')
  }

  const context = rawData.context
  const personas = context.personas as { computation_key: string; computation_id: string; external_audience_id: string }
  if (!personas.computation_key || !personas.computation_id || !personas.external_audience_id) {
    throw new PayloadValidationError(
      'Missing audience parameters: computation id, computation key, and/or audience id.'
    )
  }

  const traitsOrProps = rawData.traits || rawData.properties
  const action = traitsOrProps[personas.computation_key] ? 'subscribe' : 'usubscribe'
  const iterablePayload: UpsertUserPayload = {
    listId: Number(personas.external_audience_id),
    action: action,
    dataFields: payload.data_fields,
    preferUserId: true,
    mergeNestedObjects: true
  }

  if (payload.email) {
    iterablePayload.email = payload.email
  }

  if (payload.user_id) {
    iterablePayload.userId = payload.user_id
  }

  return iterablePayload
}

export default action
