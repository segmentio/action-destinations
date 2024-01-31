import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import dayjs from '../../../lib/dayjs'
import { AccountRegion } from '../utils'
import { nockTrackInternalEndpoint } from '../test-helper'

const trackService = nockTrackInternalEndpoint(AccountRegion.US)

describe('CustomerIO', () => {
  describe('reportDeliveryEvent', () => {
    const testDestination = createTestIntegration(CustomerIO)

    type testCase = {
      name: string
      properties: { [key: string]: unknown }
      expected: { [key: string]: unknown }
    }

    const testCases: testCase[] = [
      {
        name: 'should work with just delivery id and metric',
        properties: {
          deliveryId: 'delivery_123',
          metric: 'delivered'
        },
        expected: {
          delivery_id: 'delivery_123',
          metric: 'delivered'
        }
      },
      {
        name: 'should nest in-app metadata fields',
        properties: {
          deliveryId: 'in-app-delivery',
          metric: 'clicked',
          actionName: 'score',
          actionValue: '3'
        },
        expected: {
          delivery_id: 'in-app-delivery',
          metric: 'clicked',
          metadata: {
            action_name: 'score',
            action_value: '3'
          }
        }
      },
      {
        name: 'should ignore extra fields not part of the mappings',
        properties: {
          deliveryId: 'delivery_123',
          metric: 'bounced',
          recipient: 'test@example.com',
          reason: 'mailbox not exists',
          foo: 'bar',
          test: 123
        },
        expected: {
          delivery_id: 'delivery_123',
          metric: 'bounced',
          recipient: 'test@example.com',
          reason: 'mailbox not exists'
        }
      }
    ]

    testCases.forEach((testCase) => {
      it(testCase.name, async () => {
        trackService.post(`/api/v1/metrics`).reply(200, {}, { 'x-customerio-region': 'US' })

        const now = dayjs.utc()
        const event = createTestEvent({
          anonymousId: 'anon_123',
          timestamp: now.toISOString(),
          type: 'track',
          event: 'Report Delivery Event',
          properties: testCase.properties
        })
        const responses = await testDestination.testAction('reportDeliveryEvent', {
          event,
          useDefaultMappings: true
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
        expect(responses[0].headers.toJSON()).toMatchObject({
          'x-customerio-region': 'US',
          'content-type': 'application/json'
        })
        expect(responses[0].data).toMatchObject({})
        expect(responses[0].options.json).toEqual({
          ...testCase.expected,
          timestamp: now.unix()
        })
      })
    })
  })
})
