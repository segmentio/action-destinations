import type { ActionDefinition, AsyncActionResponseType } from '@segment/actions-core'
import { AsyncPollResponseType } from '@segment/actions-core'
import type { Settings } from '../generated-types'

interface Payload {
  campaign_id: string
  recipients?: Array<{
    external_user_id?: string
    user_alias?: {
      alias_name: string
      alias_label: string
    }
    trigger_properties?: Record<string, any>
    send_to_existing_only?: boolean
    attributes?: Record<string, any>
  }>
  broadcast?: boolean
  audience?: {
    and?: Array<Record<string, any>>
    or?: Array<Record<string, any>>
  }
  trigger_properties?: Record<string, any>
  schedule?: {
    time: string
    in_local_time?: boolean
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Trigger Campaign Batch (Async)',
  description: 'Trigger multiple Braze Campaigns via API with async batch processing',
  defaultSubscription: 'type = "track"',
  fields: {
    campaign_id: {
      label: 'Campaign ID',
      description:
        'The ID of the Braze campaign to trigger. The campaign must be an API-triggered campaign created in Braze.',
      type: 'string',
      required: true
    },
    send_id: {
      label: 'Send ID',
      description:
        'Optional string to identify the send. This can be used for send level analytics, or to cancel a send.',
      type: 'string'
    },
    trigger_properties: {
      label: 'Trigger Properties',
      description:
        'Optional data that will be used to personalize the campaign message. Personalization key-value pairs that will apply to all users in this request.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    broadcast: {
      label: 'Broadcast',
      description:
        'If set to true, and if the audience is not provided, the campaign will be sent to all the users in the segment targeted by the campaign.',
      type: 'boolean',
      default: false
    },
    recipients: {
      label: 'Recipients',
      description: 'An array of user identifiers to send the campaign to.',
      type: 'object',
      multiple: true,
      properties: {
        external_user_id: {
          label: 'External User ID',
          description: 'The external user ID to send the campaign to.',
          type: 'string'
        },
        user_alias: {
          label: 'User Alias',
          description: 'The user alias to send the campaign to.',
          type: 'object',
          properties: {
            alias_name: {
              label: 'Alias Name',
              type: 'string'
            },
            alias_label: {
              label: 'Alias Label',
              type: 'string'
            }
          }
        },
        trigger_properties: {
          label: 'Trigger Properties',
          description: 'Optional properties specific to this recipient.',
          type: 'object'
        },
        canvas_entry_properties: {
          label: 'Canvas Entry Properties',
          description: 'Optional canvas entry properties for this recipient.',
          type: 'object'
        },
        send_to_existing_only: {
          label: 'Send to Existing Only',
          description: 'Set to false to create the user if it does not exist.',
          type: 'boolean',
          default: true
        }
      },
      default: [
        {
          external_user_id: { '@path': '$.userId' },
          trigger_properties: { '@path': '$.properties' }
        }
      ]
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Number of campaigns to trigger in each batch. Maximum 75.',
      type: 'integer',
      default: 50,
      minimum: 1,
      maximum: 75
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of campaign triggers for better performance.',
      type: 'boolean',
      default: true
    }
  },

  perform: async (_, { transactionContext }): Promise<AsyncActionResponseType> => {
    transactionContext?.setTransaction('operationIds', 'abc')
    return {
      isAsync: true,
      message: 'Async batch processing started'
    }
  },

  poll: async (request, { settings, transactionContext }): Promise<AsyncPollResponseType> => {
    const batchKey = transactionContext?.transaction?.batch_key
    const totalBatchesStr = transactionContext?.transaction?.total_batches
    const completedBatchesStr = transactionContext?.transaction?.completed_batches
    const totalRequestsStr = transactionContext?.transaction?.total_requests
    const remainingPayloadStr = transactionContext?.transaction?.remaining_payload

    if (!batchKey || !remainingPayloadStr || !totalBatchesStr || !completedBatchesStr) {
      return {
        results: [
          {
            status: 'failed',
            message: 'Batch processing state not found - cannot continue async operation',
            error: {
              code: 'MISSING_STATE',
              message: 'Required batch state missing from StateContext'
            }
          }
        ],
        overallStatus: 'failed',
        message: 'Failed to continue async batch processing'
      }
    }

    try {
      const totalBatches = parseInt(totalBatchesStr, 10)
      const completedBatches = parseInt(completedBatchesStr, 10)
      const totalRequests = parseInt(totalRequestsStr || '0', 10)
      const remainingPayload = JSON.parse(remainingPayloadStr) as Payload[]

      const batchSize = 100
      const currentBatch = remainingPayload.slice(0, batchSize)

      if (currentBatch.length === 0) {
        return {
          results: [
            {
              status: 'completed',
              message: `All ${totalBatches} batches completed successfully`,
              result: {
                batch_key: batchKey,
                total_requests: totalRequests,
                total_batches: totalBatches,
                completed_batches: completedBatches
              }
            }
          ],
          overallStatus: 'completed',
          message: 'Async batch processing completed successfully'
        }
      }

      // Process current batch
      const requestBody = {
        api_key: settings.api_key,
        campaign_id: currentBatch[0].campaign_id,
        recipients: currentBatch.flatMap((item) => item.recipients || []),
        broadcast: currentBatch.some((item) => item.broadcast),
        trigger_properties: Object.assign({}, ...currentBatch.map((item) => item.trigger_properties || {})),
        audience: currentBatch.find((item) => item.audience)?.audience,
        schedule: currentBatch.find((item) => item.schedule)?.schedule
      }

      await request(`${settings.endpoint}/campaigns/trigger/send`, {
        method: 'POST',
        json: requestBody
      })

      const newCompletedBatches = completedBatches + 1
      const remaining = remainingPayload.slice(batchSize)

      if (remaining.length > 0) {
        // Update state for next poll
        transactionContext?.setTransaction('remaining_payload', JSON.stringify(remaining))
        transactionContext?.setTransaction('completed_batches', newCompletedBatches.toString())

        return {
          results: [
            {
              status: 'pending',
              message: `Processed batch ${newCompletedBatches}/${totalBatches}. ${remaining.length} campaigns remaining.`,
              context: {
                batch_key: batchKey,
                completed_batches: newCompletedBatches,
                total_batches: totalBatches,
                remaining_campaigns: remaining.length
              }
            }
          ],
          overallStatus: 'pending',
          message: `Batch processing in progress: ${newCompletedBatches}/${totalBatches} batches completed`
        }
      } else {
        // All batches completed
        return {
          results: [
            {
              status: 'completed',
              message: `All ${totalBatches} batches completed successfully. Total campaigns triggered: ${totalRequests}`,
              result: {
                batch_key: batchKey,
                total_requests: totalRequests,
                completed_batches: newCompletedBatches,
                total_batches: totalBatches
              }
            }
          ],
          overallStatus: 'completed',
          message: 'Async batch processing completed successfully'
        }
      }
    } catch (error) {
      return {
        results: [
          {
            status: 'failed',
            message: 'Failed to process batch during polling',
            error: {
              code: 'POLL_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error occurred during polling'
            }
          }
        ],
        overallStatus: 'failed',
        message: 'Async batch processing failed'
      }
    }
  }
}

export default action
