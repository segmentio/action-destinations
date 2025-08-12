import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api'
}

const payload = {
  event: 'Test Event',
  type: 'track',
  userId: 'x_id',
  properties: {
    email: 'test@test.com',
    list_id: 'list_id',
    prop1: 'value1',
    prop2: true,
    prop3: 123,
    prop4: ['value1', 'value2'],
    prop5: { nested: 'value' }
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  event: { '@path': '$.event' },
  identifiers: {
    userId: { '@path': '$.userId' },
    email: { '@path': '$.properties.email' }
  },
  listId: { '@path': '$.properties.list_id' },
  properties: { '@path': '$.properties' },
  timestamp: { '@path': '$.timestamp' }
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Yonoma', () => {
  describe('Send a sendEvent', () => {
    it('should send an sendEvent payload to Yonoma', async () => {
      const event = createTestEvent(payload)

      const json = {
        event: 'Test Event',
        userId: 'x_id',
        listId: 'list_id',
        properties: {
          prop1: 'value1',
          prop2: true,
          prop3: 123,
          prop4: ['value1', 'value2'],
          prop5: { nested: 'value' }
        },
        timestamp: '2023-10-01T00:00:00Z'
      }
      nock('https://api.yonoma.io').post('/integration/segment/sendevent', json).reply(200, {})

      const response = await testDestination.testAction('sendEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response.length).toBe(1)
    })
  })
})
