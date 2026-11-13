import { ErrorCodes, MultiStatusResponse } from '@segment/actions-core'
import type { ActionDefinition, JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { addAudienceId, customerProfileId, deleteAudienceId } from '../t1-properties'
import {
  DEFAULT_SEGMENT_EVENTS_PER_BATCH,
  ENDPOINT,
  MAX_AUDIENCE_CHANGES_PER_SEGMENT_EVENT,
  MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST,
  SEGMENT_EVENTS_PER_BATCH
} from './constants'
import { buildChunks, findConflictedIndexes, findOversizedIndexes } from './functions'
import type { RequestError, UpdateAudiencesJSON } from './types'

const AUDIENCE_IDS_DESCRIPTION = `You should get these audience IDs from Talon.One. When batching is enabled, an event can add or remove at most ${MAX_AUDIENCE_CHANGES_PER_SEGMENT_EVENT} audiences in total across Adds and Deletes. Events over this limit are rejected. Segment sends one request of up to ${MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST} audience changes per batch, and events beyond that are retried in a later batch. To reduce retries, keep Batch Size multiplied by the changes per event at or below ${MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST}.`

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Multiple Customer Profiles’ Audiences',
  description: 'This updates audiences for multiple customer profiles.',
  fields: {
    data: {
      label: 'Data item to change customer profile audiences',
      description:
        'An array of JSON objects that contains customer profile identifier and list of audiences to associate and dissociate with the indicated customer profile. Customer profile ID and at least one audience ID are required.',
      type: 'object',
      multiple: true,
      properties: {
        customerProfileId: { ...customerProfileId },
        adds: {
          ...addAudienceId,
          description: AUDIENCE_IDS_DESCRIPTION
        },
        deletes: {
          ...deleteAudienceId,
          description: AUDIENCE_IDS_DESCRIPTION
        }
      },
      required: true
    },
    enable_batching: {
      label: 'Batch Data to Talon.One',
      description:
        'When enabled, Segment sends events to Talon.One in batches, with many customer profiles in one request.',
      type: 'boolean',
      default: true,
      required: false
    },
    batch_size: {
      label: 'Batch Size',
      description: `Maximum number of events to include in each batch. Actual batch sizes may be smaller. Segment sends one request of up to ${MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST} audience changes per batch, and events beyond that are retried in a later batch, which uses up their limited retries. To reduce retries, keep this value multiplied by the changes per event at or below ${MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST}.`,
      type: 'number',
      default: DEFAULT_SEGMENT_EVENTS_PER_BATCH,
      minimum: 1,
      maximum: SEGMENT_EVENTS_PER_BATCH,
      required: false
    }
  },
  perform: (request, { payload }) => {
    const json: UpdateAudiencesJSON = { data: payload.data }
    return request(ENDPOINT, {
      method: 'put',
      json
    })
  },
  performBatch: async (request, { payload }) => {
    const multiStatus = new MultiStatusResponse()

    const oversized = findOversizedIndexes(payload)
    oversized.forEach((index) => {
      multiStatus.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage: `An event can add or remove at most ${MAX_AUDIENCE_CHANGES_PER_SEGMENT_EVENT} audiences in total when batching is enabled.`
      })
    })

    const conflicted = findConflictedIndexes(payload.map((p, index) => (oversized.has(index) ? { data: [] } : p)))
    conflicted.forEach((index) => {
      multiStatus.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
        errormessage:
          'The same audience is both added and removed for the same customer profile in this batch, so the event was rejected.'
      })
    })

    const valid = payload
      .map((p, index) => ({ index, data: p.data }))
      .filter(({ index }) => !oversized.has(index) && !conflicted.has(index))

    const [firstChunk, ...deferredChunks] = buildChunks(valid)

    deferredChunks.forEach((chunk) => {
      chunk.indexes.forEach((index) => {
        multiStatus.setErrorResponseAtIndex(index, {
          status: 503,
          errortype: ErrorCodes.RETRYABLE_ERROR,
          errormessage: `This batch has more than ${MAX_AUDIENCE_CHANGES_PER_TALON_ONE_REQUEST} audience changes, which is the most Segment sends to Talon.One in one request. The event will be retried in a later batch.`
        })
      })
    })

    if (firstChunk) {
      const json: UpdateAudiencesJSON = { data: firstChunk.data }
      try {
        await request(ENDPOINT, {
          method: 'put',
          json
        })
        firstChunk.indexes.forEach((index) => {
          multiStatus.setSuccessResponseAtIndex(index, {
            status: 200,
            sent: { data: payload[index].data } as JSONLikeObject,
            body: { success: true }
          })
        })
      } catch (error) {
        const err = error as RequestError
        const status = err.response?.status ?? 500
        const talonOneError = err.response?.data
        const body = (talonOneError ?? err.message ?? '') as JSONLikeObject | string
        const errormessage = talonOneError?.Error ?? err.message ?? 'Request to Talon.One failed'
        firstChunk.indexes.forEach((index) => {
          multiStatus.setErrorResponseAtIndex(index, {
            status,
            errormessage,
            sent: { data: payload[index].data } as JSONLikeObject,
            body
          })
        })
      }
    }

    return multiStatus
  }
}

export default action
