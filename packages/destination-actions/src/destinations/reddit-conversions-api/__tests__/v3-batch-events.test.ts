import crypto from 'crypto'
import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONObject, SegmentEvent } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { LEGACY_API_VERSION } from '../versioning-info'

const testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const epochMs = 1704721970212
const settings: Settings = {
  ad_account_id: 'ad_account_id_1',
  conversion_token: 'conversion_token_1'
}

// Matches processHashing('sha256', 'hex', (value) => value.trim()) in ../utils.ts
const sha256 = (value: string) => crypto.createHash('sha256').update(value.trim()).digest('hex')

describe('Reddit Conversions Api - V3 batch events', () => {
  it('handles a batch of 10: 2 fail schema validation, 2 fail Reddit-side validation inside performBatch, 6 succeed', async () => {
    nock('https://ads-api.reddit.com').post('/api/v3/pixels/ad_account_id_1/conversion_events').reply(200, {})

    // Interleaved on purpose so the 6 successes aren't all bunched at one end of the batch -
    // 'schemaInvalid' fails Segment's own schema validation (action_source is conditionally required
    // when api_version is v3) and never reaches performBatch; 'businessInvalid' passes schema (has
    // action_source) but is missing products.id, which is only enforced inside performBatch by
    // toProductIdV3; 'valid' should succeed end to end.
    const kinds = [
      'valid',
      'schemaInvalid',
      'valid',
      'businessInvalid',
      'valid',
      'schemaInvalid',
      'valid',
      'businessInvalid',
      'valid',
      'valid'
    ] as const

    const events: SegmentEvent[] = kinds.map((kind, i) => {
      const properties: JSONObject = { revenue: 100 }
      if (kind !== 'schemaInvalid') properties.action_source = 'WEBSITE'
      properties.products =
        kind === 'businessInvalid'
          ? [{ category: `c${i}`, name: `n${i}` }]
          : [{ product_id: `p${i}`, category: `c${i}`, name: `n${i}` }]

      return createTestEvent({
        timestamp,
        event: 'Order Completed',
        messageId: `msg-${i}`,
        type: 'track',
        userId: `user_id_${i}`,
        properties
      })
    })

    await testDestination.testBatchAction('standardEvent', {
      events,
      settings,
      useDefaultMappings: true,
      mapping: {
        tracking_type: 'Purchase',
        api_version: 'v3',
        action_source: { '@path': '$.properties.action_source' }
      }
    })

    const multistatus = testDestination.results.at(0)?.multistatus
    expect(multistatus).toHaveLength(10)

    kinds.forEach((kind, i) => {
      if (kind === 'schemaInvalid') {
        // Schema validation failure (Segment core, before performBatch is ever called).
        expect(multistatus?.[i]).toEqual({
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage:
            'The root value is missing the required field \'action_source\'. The root value must match "then" schema.',
          errorreporter: 'INTEGRATIONS'
        })
      } else if (kind === 'businessInvalid') {
        // Reddit-side validation failure (our own code, inside performBatch).
        expect(multistatus?.[i]).toEqual({
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: 'products.id is required when sending to Reddit Conversions API v3',
          errorreporter: 'INTEGRATIONS'
        })
      } else {
        expect(multistatus?.[i]).toEqual({
          status: 200,
          sent: {
            event_at: epochMs,
            action_source: 'WEBSITE',
            event_source_url: 'https://segment.com/academy/',
            type: {
              tracking_type: 'PURCHASE'
            },
            event_metadata: {
              value: 100,
              products: [
                {
                  category: `c${i}`,
                  id: `p${i}`,
                  name: `n${i}`
                }
              ],
              conversion_id: sha256(`msg-${i}`)
            },
            user: {
              external_id: sha256(`user_id_${i}`),
              ip_address: sha256('8.8.8.8'),
              user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            }
          },
          body: { success: true }
        })
      }
    })
  })

  it('returns a plain response (no MultiStatusResponse) for a pure V2 batch', async () => {
    nock('https://ads-api.reddit.com').post('/api/v2.0/conversions/events/ad_account_id_1').reply(200, {})

    const events: SegmentEvent[] = [0, 1, 2].map((i) =>
      createTestEvent({
        timestamp,
        event: 'Order Completed',
        messageId: `msg-v2-${i}`,
        type: 'track',
        userId: `user_id_${i}`,
        properties: { revenue: 100 }
      })
    )

    await testDestination.testBatchAction('standardEvent', {
      events,
      settings,
      useDefaultMappings: true,
      mapping: {
        tracking_type: 'Purchase',
        api_version: LEGACY_API_VERSION
      }
    })

    // A pure-V2 batch never builds our own MultiStatusResponse - performBatch just returns the
    // plain send() response, so core falls back to its own legacy "whole batch response" handling
    // (fillMultiStatusResponse), marking every index success with the same status/body.
    const multistatus = testDestination.results.at(0)?.multistatus
    expect(multistatus).toHaveLength(3)
    multistatus?.forEach((entry) => {
      expect(entry).toMatchObject({ status: 200, body: {} })
    })
  })
})
