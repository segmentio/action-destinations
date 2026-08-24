import { external_id, lookup_field, data, enable_batching, batch_size, event_name } from '../properties'

// Shared field set for both the sync (index.ts) and async (index.async.ts) variants of this action.
// They MUST stay identical so the async pipeline can route by the same schema (mirrors the SFMC
// asyncDataExtension pattern). Only the sync variant is emitted into metadata.json.
export const fields = {
  external_id: { ...external_id },
  lookup_field: { ...lookup_field },
  data: { ...data },
  // Exposed (unhidden) for this action so it can be seen/toggled in the mapping UI.
  enable_batching: { ...enable_batching, unsafe_hidden: false },
  batch_size: { ...batch_size },
  event_name: { ...event_name },
  // Platform flag that signals Segment's async pipeline to route this action through the async
  // (performBatch + performPoll) lifecycle. Exposed in the mapping UI. Not read by action code.
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
    unsafe_hidden: false
  }
}
