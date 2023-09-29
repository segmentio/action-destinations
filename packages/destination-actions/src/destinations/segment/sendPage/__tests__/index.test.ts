import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'
const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Page Mapping
const defaultPageMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  page_name: {
    '@path': '$.name'
  },
  properties: {
    '@path': '$.properties'
  }
}

describe('Segment.sendPage', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        title: 'Home | Example Company',
        url: 'http://www.example.com'
      }
    })

    await expect(
      testDestination.testAction('sendPage', {
        event,
        mapping: {}
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should not send event and return transformed payload', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        title: 'Home | Example Company',
        url: 'http://www.example.com'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    const responses = await testDestination.testAction('sendPage', {
      event,
      mapping: defaultPageMapping,
      settings: {
        source_write_key: 'test-source-write-key'
      }
    })

    const results = testDestination.results
    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchObject({
      batch: [
        {
          userId: event.userId,
          anonymousId: event.anonymousId,
          properties: {
            name: event.name,
            ...event.properties
          },
          context: {}
        }
      ]
    })
  })
})
