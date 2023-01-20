import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../../errors'
import { SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from '../../properties'

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
  engage_space: 'engage-space-writekey'
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
  test('Should throw an error if Segment Endpoint is incorrectly defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Example Corp',
        industry: 'Technology'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      groupId: 'test-group-ks2i7e'
    })

    await expect(
      testDestination.testAction('sendGroup', {
        event,
        mapping: defaultGroupMapping,
        settings: {
          segment_papi_token: 'segment-papi-token',
          endpoint: 'incorrect-endpoint'
        }
      })
    ).rejects.toThrowError(InvalidEndpointSelectedThrowableError)
  })

  test('Should send an group event to Segment', async () => {
    // Mock: Segment Group Call
    const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].url
    nock(segmentEndpoint).post('/group').reply(200, { success: true })

    const event = createTestEvent({
      traits: {
        name: 'Example Corp',
        industry: 'Technology'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      groupId: 'test-group-ks2i7e'
    })

    const responses = await testDestination.testAction('sendGroup', {
      event,
      mapping: defaultGroupMapping,
      settings: {
        segment_papi_token: 'segment-papi-token',
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })
})
