import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'aliasUser'
const testSettings: Settings = {
  client_id: '123123123'
}

describe('LaunchDarkly.aliasUser', () => {
  it('should send an alias event to LaunchDarkly for identify events with default mapping', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'identify',
      userId: 'user1234',
      anonymousId: '701a9c00-aabe-4074-80b7-0fd6cab41c08',
      timestamp: '2022-03-30T17:24:58Z'
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: testSettings,
      useDefaultMappings: true
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].options.json).toMatchObject([
      {
        kind: 'alias',
        key: 'user1234',
        previousKey: '701a9c00-aabe-4074-80b7-0fd6cab41c08',
        contextKind: 'user',
        previousContextKind: 'anonymousUser',
        creationDate: 1648661098000
      }
    ])
  })

  it('should send an identify event to LaunchDarkly for alias events with default mapping', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'alias',
      userId: 'user1234',
      previousId: '701a9c00-aabe-4074-80b7-0fd6cab41c08',
      timestamp: '2022-03-30T17:24:58Z'
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: testSettings,
      useDefaultMappings: true
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
    expect(responses[0].options.json).toMatchObject([
      {
        kind: 'alias',
        key: 'user1234',
        previousKey: '701a9c00-aabe-4074-80b7-0fd6cab41c08',
        contextKind: 'user',
        previousContextKind: 'anonymousUser',
        creationDate: 1648661098000
      }
    ])
  })

  it('should throw and error if previous_key is missing', async () => {
    nock('https://events.launchdarkly.com').post(`/events/bulk/${testSettings.client_id}`).reply(202)

    const event = createTestEvent({
      type: 'identify',
      userId: 'user1234',
      anonymousId: null,
      previousId: null,
      timestamp: '2022-03-30T17:24:58Z'
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event,
        settings: testSettings,
        useDefaultMappings: true
      })
    ).rejects.toThrowError("The root value is missing the required field 'previous_key'.")
  })
})
