import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'
import { DEFAULT_SEGMENT_ENDPOINT } from '../../properties'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Group Mapping
const defaultGroupMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  group_id: {
    '@path': '$.groupId'
  },
  traits: {
    '@path': '$.traits'
  },
  engage_space: 'engage-space-writekey',
  timestamp: {
    '@path': '$.timestamp'
  }
}

describe('SegmentProfiles.sendGroup', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Example Corp',
        industry: 'Technology'
      },
      groupId: 'test-group-ks2i7e'
    })

    await expect(
      testDestination.testAction('sendGroup', {
        event,
        mapping: {
          group_id: {
            '@path': '$.groupId'
          },
          engage_space: 'engage-space-writekey'
        }
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should return transformed event', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Example Corp',
        industry: 'Technology'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      groupId: 'test-group-ks2i7e',
      timestamp: '2023-09-26T09:46:28.290Z'
    })

    const responses = await testDestination.testAction('sendGroup', {
      event,
      mapping: defaultGroupMapping,
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
