import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'
import { VOICEOPS_BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)
const SETTINGS: Settings = {
  accessToken: 'voiceops-token'
}

function createCallCompletedEvent(properties: Record<string, unknown> = {}) {
  return createTestEvent({
    type: 'track',
    event: 'call_completed',
    properties: {
      call_id: 'call-123',
      call_started_at: '1712683200',
      agent_email: 'agent@voiceops.com',
      mp3_Link: 'https://example.com/audio.mp3',
      ...properties
    }
  })
}

describe('Voiceops.sendCallCompleted', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('posts the minimal valid call payload with bearer auth', async () => {
    nock(VOICEOPS_BASE_URL)
      .post('/frontline-api/integrations/v1/segment/calls')
      .matchHeader('authorization', 'Bearer voiceops-token')
      .matchHeader('user-agent', 'Segment')
      .reply(200, {})

    const event = createCallCompletedEvent()

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      call_id: 'call-123',
      call_started_at: '1712683200',
      agent_email: 'agent@voiceops.com',
      mp3_Link: 'https://example.com/audio.mp3'
    })
  })

  it('forwards multi-channel recordings and channels unchanged', async () => {
    nock(VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      mp3_Link: undefined,
      multi_channel_recording_link: 'https://example.com/audio.wav',
      channels: [
        {
          channel: 3,
          type: 'HANDLING_AGENT',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: 'agent@voiceops.com',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].options.json).toMatchObject({
      multi_channel_recording_link: 'https://example.com/audio.wav',
      channels: [
        {
          channel: 3,
          type: 'HANDLING_AGENT',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: 'agent@voiceops.com',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })
  })

  it('forwards extraMetadata unchanged', async () => {
    nock(VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      extraMetadata: {
        opportunityId: 'opp-123',
        policyIds: ['pol-1', 'pol-2'],
        campaign: 'spring-renewals'
      }
    })

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].options.json).toMatchObject({
      extraMetadata: {
        opportunityId: 'opp-123',
        policyIds: ['pol-1', 'pol-2'],
        campaign: 'spring-renewals'
      }
    })
  })

  it('fails before sending when no audio link is present', async () => {
    const event = createCallCompletedEvent({
      mp3_Link: '',
      multi_channel_recording_link: '   '
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow(PayloadValidationError)
  })

  it('still succeeds when first_name and last_name are omitted', async () => {
    nock(VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      first_name: undefined,
      last_name: undefined
    })

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      call_id: 'call-123',
      agent_email: 'agent@voiceops.com'
    })
    expect(responses[0].options.json).not.toHaveProperty('first_name')
    expect(responses[0].options.json).not.toHaveProperty('last_name')
  })
})
