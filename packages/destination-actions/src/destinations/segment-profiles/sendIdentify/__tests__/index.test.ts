import nock from 'nock'
import Destination from '../..'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { DEFAULT_SEGMENT_ENDPOINT } from '../../properties'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Identify Mapping
const defaultIdentifyMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  traits: {
    '@path': '$.traits'
  },
  engage_space: 'engage-space-writekey',
  timestamp: {
    '@path': '$.timestamp'
  }
}

describe('Segment.sendIdentify', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      }
    })

    await expect(
      testDestination.testAction('sendIdentify', {
        event,
        mapping: {
          engage_space: 'engage-space-writekey'
        }
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should return transformed event', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      timestamp: '2023-09-26T09:46:28.290Z'
    })

    const responses = await testDestination.testAction('sendIdentify', {
      event,
      mapping: defaultIdentifyMapping,
      settings: {
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      }
    })
    const results = testDestination.results

    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchSnapshot()
  })
})
