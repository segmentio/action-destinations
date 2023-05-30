import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { DEVREV_API_KEY, DEVREV_DEV_API_ENDPOINT } from '../../constants'

let testDestination = createTestIntegration(Destination)

beforeEach((done) => {
  // Re-Initialize the destination before each test
  // This is done to mitigate a bug where action responses persist into other tests
  testDestination = createTestIntegration(Destination)
  nock.cleanAll()
  done()
})

describe('DevrevTest.streamEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {
        email: 'vep@beri.dz',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'city'
      }
    })

    try {
      await testDestination.testAction('createList', {
        event:event,
        settings: { devOrgId:"DEV-xyz", apiKey: DEVREV_API_KEY },
      })
    } catch (err:any) {
      expect(err.message).toContain("missing the required field 'event'.")
    }
  })

  it('should work', async () => {
    const event = createTestEvent({
      event: 'pe22596207_test_event_http',
      type: 'track',
      properties: {
        email: 'vep@beri.dz',
        utk: 'abverazffa===1314122f',
        userId: '802',
        city: 'city'
      },
    })

    const mapping = {
      eventName: {
        '@path': '$.event'
      },
      occurredAt: {
        '@path': '$.timestamp'
      },
      userId: {
        '@path': '$.properties.userId'
      },
      email: {
        '@path': '$.properties.email'
      },
      properties: {
        '@path': '$.properties'
      },
    }

    nock(`${DEVREV_DEV_API_ENDPOINT}`)
      .post('/track-events.publish')
      .reply(200)

    const [response] = await testDestination.testAction('streamEvent', {
      event:event,
      mapping:mapping,
      settings: { devOrgId:"DEV-xyz",apiKey: DEVREV_API_KEY },
      useDefaultMappings: true
    })

    expect(response.status).toBe(200)
  })
})
