import { RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'

// STAGING TEST ONLY. Fires one track event per performBatch call so we can see what the
// upstream batching service actually delivered - batch size, batch keys, and the add/remove
// split. Deliberately carries no event payload data, only counts and resolved config.
// Delete this file and its call site before this goes anywhere near main.

const WRITE_KEY = 'kjTCidX4G4T14c0NwwljSmaEDYqdQHgY'
const TRACK_URL = 'https://api.segment.io/v1/track'

const distinct = (values: unknown[]) => [...new Set(values.map((v) => JSON.stringify(v) ?? 'undefined'))]

export async function sendBatchProbe(
  request: RequestClient,
  payloads: Payload[],
  addCount: number,
  removeCount: number,
  unresolvedCount: number
) {
  try {
    await request(TRACK_URL, {
      method: 'POST',
      // Overrides the Marketo Bearer token that extendRequest would otherwise attach.
      headers: { authorization: `Basic ${Buffer.from(`${WRITE_KEY}:`).toString('base64')}` },
      throwHttpErrors: false,
      json: {
        anonymousId: 'marketo-synclist-batch-probe',
        event: 'Marketo Sync List Batch',
        properties: {
          event_count: payloads.length,
          add_count: addCount,
          remove_count: removeCount,
          unresolved_count: unresolvedCount,
          resolved_batch_size: distinct(payloads.map((p) => p.batch_size)),
          batch_keys: payloads[0]?.batch_keys ?? null,
          audience_membership_values: distinct(payloads.map((p) => p.audience_membership)),
          event_names: distinct(payloads.map((p) => p.event_name)),
          lookup_field: payloads[0]?.lookup_field ?? null,
          external_id: payloads[0]?.external_id ?? null
        }
      }
    })
  } catch {
    // Never let the probe affect delivery.
  }
}
