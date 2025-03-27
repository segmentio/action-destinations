import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import CustomerIO from '../index'
import dayjs from '../../../lib/dayjs'
import { AccountRegion } from '../utils'
import { nockTrackInternalEndpoint } from '../test-helper'

const trackService = nockTrackInternalEndpoint(AccountRegion.US)

describe('CustomerIO', () => {
  describe('reportContentEvent', () => {
    const testDestination = createTestIntegration(CustomerIO)

    type testCase = {
      name: string
      anonymousId: string
      properties: { [key: string]: any }
      expected: { [key: string]: any }
    }

    const testCases: testCase[] = [
      {
        name: 'should work with viewed',
        anonymousId: 'abc123',
        properties: {
          actionType: 'viewed_content',
          contentType: 'ctype',
          contentId: 1,
          templateId: 1
        },
        expected: {
          action: 'viewed_content',
          attributes: {
            contentType: 'ctype',
            contentId: 1,
            templateId: 1
          },
          identifiers: {
            anonymous_id: 'abc123'
          },
          name: 'viewed_content',
          type: 'person'
        }
      },
      {
        name: 'should work with clicked',
        anonymousId: 'abc123',
        properties: {
          actionType: 'clicked_content',
          contentType: 'ctype',
          contentId: 1,
          templateId: 1,
          actionName: 'aname',
          actionValue: 'avalue'
        },
        expected: {
          action: 'clicked_content',
          attributes: {
            contentType: 'ctype',
            contentId: 1,
            templateId: 1,
            actionName: 'aname',
            actionValue: 'avalue'
          },
          identifiers: {
            anonymous_id: 'abc123'
          },
          name: 'clicked_content',
          type: 'person'
        }
      }
    ]

    testCases.forEach((testCase) => {
      it(testCase.name, async () => {
        trackService.post(`/api/v2/entity`).reply(200, {}, { 'x-customerio-region': 'US' })

        const now = dayjs.utc()
        const event = createTestEvent({
          anonymousId: testCase.anonymousId,
          timestamp: now.toISOString(),
          type: 'track',
          event: 'Report Content Event',
          properties: testCase.properties
        })
        const responses = await testDestination.testAction('reportContentEvent', {
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
