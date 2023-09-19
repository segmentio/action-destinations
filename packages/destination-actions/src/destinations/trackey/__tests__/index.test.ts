import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const base = 'https://app.trackey.io'
const url = '/public-api/integrations/segment/webhook'

describe('Trackey', () => {
  it('sould fail if the api key is not included', async () => {
    nock(base).post(url).reply(200)

    try {
      await testDestination.testAction('track', {
        settings: {
          //apiKey: 'test-api-key'
        },
        event: createTestEvent({ event: 'flow_started', userId: 'test-user-id' })
      })
    } catch (error) {
      expect(error.message).toEqual('The apiKey field is required')
    }
  })
  it('should send a track', async () => {
    nock(base).post(url).reply(200)

    await expect(
      testDestination.testAction('track', {
        settings: {
          apiKey: 'test-api-key'
        },
        event: createTestEvent({ type: 'track', event: 'flow_started', userId: 'test-user-id' })
      })
    ).resolves.not.toThrowError()
  })
  it('should send an identify call', async () => {
    nock(base).post(url).reply(200)

    await expect(
      testDestination.testAction('identify', {
        settings: {
          apiKey: 'test-api-key'
        },
        event: createTestEvent({ type: 'identify', userId: 'test-user-id' })
      })
    ).resolves.not.toThrowError()
  })
  it('should send a group call', async () => {
    nock(base).post(url).reply(200)

    await expect(
      testDestination.testAction('group', {
        settings: {
          apiKey: 'test-api-key'
        },
        event: createTestEvent({ type: 'identify', userId: 'test-user-id' })
      })
    ).resolves.not.toThrowError()
  })
})
