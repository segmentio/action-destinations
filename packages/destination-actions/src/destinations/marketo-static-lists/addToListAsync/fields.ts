import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { external_id, lookup_field, data, enable_batching, event_name } from '../properties'

// Shared by the sync twin (index.ts) and the async definition (index.async.ts), so both resolve
// to the same generated Payload type.
export const title = 'Add to List (Async)'
export const description =
  'Add users to a static list in Marketo using bulk import, and track the import job to completion.'
export const defaultSubscription = 'event = "Audience Entered"'

// No batch_size / batch_bytes: batching for the async action is owned by the async pipeline.
export const fields: ActionDefinition<Settings>['fields'] = {
  external_id: { ...external_id },
  lookup_field: { ...lookup_field },
  data: { ...data },
  enable_batching: { ...enable_batching },
  event_name: { ...event_name },
  // Both hidden from customers: they size the cohort batches handed to the async pipeline.
  // Marketo rejects a bulk import file of 10MB or more (CSV_LIMIT), and one batch is one file.
  // Starting values - tune against real lead row sizes once measured in staging.
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number' as const,
    required: false,
    minimum: 1,
    maximum: 30000,
    default: 10000,
    unsafe_hidden: true
  },
  batch_bytes: {
    label: 'Batch Bytes',
    description:
      'Maximum size of a batch in bytes. Kept below the 10MB bulk import file limit, since one batch becomes one CSV file.',
    type: 'number' as const,
    required: false,
    minimum: 100000,
    maximum: 8000000,
    default: 5000000,
    unsafe_hidden: true
  },
  // Routing flag read by the async pipeline (same field as SFMC's asyncDataExtension). Hidden
  // from customers; 'sync' opts a subscription out of the async pipeline.
  subscription_type: {
    label: 'Subscription Type',
    description: 'The type of subscription. Flag for enabling Async Pipeline.',
    type: 'string' as const,
    choices: [
      { label: 'Sync', value: 'sync' },
      { label: 'Async', value: 'async' }
    ],
    default: 'async',
    required: false,
    unsafe_hidden: true
  }
}
