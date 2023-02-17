import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'
import { Payload } from '../generated-types'
import { apiBaseUrl } from '../../properties'

const testDestination = createTestIntegration(Destination)
const LIVELIKE_CLIENT_ID = 'test-client-id'
const LIVELIKE_PRODUCER_TOKEN = 'test-producer-token'
const timestamp = '2021-08-17T15:21:15.449Z'
const livelike_profile_id = 'user123'

const expectedEvent: Payload = {
  action_key: 'test-event',
  properties: {},
  timestamp: timestamp
}

describe('LiveLike.trackEvent', () => {
  it('should throw integration error when clientId and producerToken is not configured', async () => {
    const event = createTestEvent({
      timestamp,
      properties: {
        action_key: 'test-event',
        livelike_profile_id: livelike_profile_id
      }
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new IntegrationError('Missing client ID or producer token.'))
  })

  it('should throw integration error when livelike_profile_id or user_id is not found or null', async () => {
    const event = createTestEvent({
      //Need to set userId as null because `createTestEvent` and `testAction` adds a default userId which will fail the test everytime.
      userId: null,
      timestamp,
      properties: {
        action_key: 'test-event'
      }
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          clientId: LIVELIKE_CLIENT_ID,
          producerToken: LIVELIKE_PRODUCER_TOKEN
        }
      })
    ).rejects.toThrowError(
      new IntegrationError('`livelike_profile_id` or `user_id` is required.', 'Missing required fields', 400)
    )
  })

  it('should throw integration error when action_key is not found', async () => {
    const event = createTestEvent({
      timestamp,
      properties: {
        livelike_profile_id: livelike_profile_id
      }
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          clientId: LIVELIKE_CLIENT_ID,
          producerToken: LIVELIKE_PRODUCER_TOKEN
        }
      })
    ).rejects.toThrowError(new IntegrationError("The root value is missing the required field 'action_key'."))
  })

  it('should validate action fields when userId is found and not livelike_profile_id ', async () => {
    const event = createTestEvent({
      userId: livelike_profile_id,
      timestamp,
      properties: {
        action_key: 'test-event'
      }
    })

    nock(apiBaseUrl)
      .post(`/applications/${LIVELIKE_CLIENT_ID}/segment-events/`)
      .matchHeader('authorization', `Bearer ${LIVELIKE_PRODUCER_TOKEN}`)
      .reply(202, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        clientId: LIVELIKE_CLIENT_ID,
        producerToken: LIVELIKE_PRODUCER_TOKEN
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      events: [
        {
          ...expectedEvent,
          user_id: livelike_profile_id
        }
      ]
    })
  })

  it('should validate action fields when livelike_profile_id is found and not user_id ', async () => {
    const event = createTestEvent({
      timestamp,
      properties: {
        action_key: 'test-event',
        livelike_profile_id: livelike_profile_id
      }
    })

    nock(apiBaseUrl)
      .post(`/applications/${LIVELIKE_CLIENT_ID}/segment-events/`)
      .matchHeader('authorization', `Bearer ${LIVELIKE_PRODUCER_TOKEN}`)
      .reply(202, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        clientId: LIVELIKE_CLIENT_ID,
        producerToken: LIVELIKE_PRODUCER_TOKEN
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      events: [
        {
          ...expectedEvent,
          livelike_profile_id: livelike_profile_id
        }
      ]
    })
  })

  // Commented batching tests until the segment team supports rejecting a single event in a batch
  // it('should invoke performBatch for batches', async () => {
  //   const events = [
  //     createTestEvent({
  //       timestamp,
  //       properties: {
  //         action_key: 'test-event',
  //         livelike_profile_id: livelike_profile_id
  //       }
  //     }),
  //     createTestEvent({
  //       timestamp,
  //       properties: {
  //         action_key: 'test-event',
  //         livelike_profile_id: livelike_profile_id
  //       }
  //     })
  //   ]

  //   nock(apiBaseUrl)
  //     .post(`/applications/${LIVELIKE_CLIENT_ID}/segment-events/`)
  //     .matchHeader('authorization', `Bearer ${LIVELIKE_PRODUCER_TOKEN}`)
  //     .reply(202, {})

  //   const responses = await testDestination.testBatchAction('trackEvent', {
  //     events,
  //     useDefaultMappings: true,
  //     settings: {
  //       clientId: LIVELIKE_CLIENT_ID,
  //       producerToken: LIVELIKE_PRODUCER_TOKEN
  //     }
  //   })

  //   expect(responses.length).toBe(1)
  //   expect(responses[0].status).toBe(202)
  //   expect(responses[0].data).toMatchObject({})
  //   expect(responses[0].options.json).toMatchObject({
  //     events: [
  //       {
  //         ...expectedEvent,
  //         livelike_profile_id: livelike_profile_id
  //       },
  //       {
  //         ...expectedEvent,
  //         livelike_profile_id: livelike_profile_id
  //       }
  //     ]
  //   })
  // })

  it('should validate action fields when event type is page or screen(presets) ', async () => {
    const event = createTestEvent({
      type: 'page',
      timestamp,
      properties: {
        name: 'Home Page',
        action_key: 'test-event',
        livelike_profile_id: livelike_profile_id
      }
    })

    nock(apiBaseUrl)
      .post(`/applications/${LIVELIKE_CLIENT_ID}/segment-events/`)
      .matchHeader('authorization', `Bearer ${LIVELIKE_PRODUCER_TOKEN}`)
      .reply(202, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      // Using the mapping of presets with event type 'page' and 'screen'
      mapping: {
        action_name: {
          '@if': {
            exists: { '@path': '$.properties.action_name' },
            then: { '@path': '$.properties.action_name' },
            else: { '@path': '$.properties.name' }
          }
        }
      },
      useDefaultMappings: true,
      settings: {
        clientId: LIVELIKE_CLIENT_ID,
        producerToken: LIVELIKE_PRODUCER_TOKEN
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      events: [
        {
          ...expectedEvent,
          livelike_profile_id: livelike_profile_id,
          action_name: 'Home Page'
        }
      ]
    })
  })
})
