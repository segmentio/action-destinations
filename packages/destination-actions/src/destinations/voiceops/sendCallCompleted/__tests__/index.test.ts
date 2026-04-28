import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'
import { DEFAULT_VOICEOPS_BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)
const SETTINGS: Settings = {
  accessToken: 'voiceops-token',
  baseUrl: DEFAULT_VOICEOPS_BASE_URL
}

function createCallCompletedEvent(
  properties: Record<string, unknown> = {},
  { includeDefaultRecording = true }: { includeDefaultRecording?: boolean } = {}
) {
  const eventProperties: Record<string, unknown> = {
    call_id: 'call-123',
    call_started_at: '1712683200',
    agent_email: 'agent@voiceops.com',
    ...properties
  }

  if (includeDefaultRecording && !Object.prototype.hasOwnProperty.call(properties, 'recording_url')) {
    eventProperties.recording_url = 'https://example.com/audio.wav'
  }

  return createTestEvent({
    type: 'track',
    event: 'Call Completed',
    properties: eventProperties
  })
}

describe('Voiceops.sendCallCompleted', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('posts the minimal valid call payload with bearer auth', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL)
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
      call_started_at: expect.any(String),
      agent_email: 'agent@voiceops.com',
      recording_url: 'https://example.com/audio.wav'
    })
    expect(responses[0].options.json).not.toHaveProperty('channels')
    expect(responses[0].options.json).not.toHaveProperty('agentLegs')
  })

  it('forwards channels with a supported type unchanged', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      recording_url: 'https://example.com/audio.wav',
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
      recording_url: 'https://example.com/audio.wav',
      channels: [
        {
          channel: 3,
          type: 'HANDLING_AGENT',
          recording_start_time: expect.any(String),
          identifier: 'agent@voiceops.com',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })
  })

  it('forwards agentLegs unchanged', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      agentLegs: [
        {
          agent_email: 'first-agent@voiceops.com',
          started_at: '2025-12-08T13:32:47.000Z',
          ended_at: '2025-12-08T13:35:47.000Z',
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
      agentLegs: [
        {
          agent_email: 'first-agent@voiceops.com',
          started_at: expect.any(String),
          ended_at: expect.any(String),
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })
  })

  it('rejects payloads that include both channels and agentLegs', async () => {
    const event = createCallCompletedEvent({
      channels: [
        {
          channel: 3,
          type: 'HANDLING_AGENT',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: 'agent@voiceops.com'
        }
      ],
      agentLegs: [
        {
          agent_email: 'agent@voiceops.com',
          started_at: '2025-12-08T13:32:47.000Z',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Provide only one of channels or agentLegs.')
  })

  it('forwards extraMetadata unchanged', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

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

  it('fails when recording_url is missing', async () => {
    const event = createCallCompletedEvent({}, { includeDefaultRecording: false })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('still succeeds when first_name and last_name are omitted', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({ first_name: undefined, last_name: undefined })

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

  it('still succeeds when neither channels nor agentLegs are provided', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent()

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).not.toHaveProperty('channels')
    expect(responses[0].options.json).not.toHaveProperty('agentLegs')
  })

  it('fails when a channel type is not supported', async () => {
    const event = createCallCompletedEvent({
      channels: [
        {
          channel: 2,
          type: 'SUPERVISOR',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: 'agent@voiceops.com'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('fails when an agent leg is missing agent_email', async () => {
    const event = createCallCompletedEvent({
      agentLegs: [
        {
          started_at: '2025-12-08T13:32:47.000Z',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('fails when an agent leg is missing started_at', async () => {
    const event = createCallCompletedEvent({
      agentLegs: [
        {
          agent_email: 'agent@voiceops.com',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('fails when an agent leg timestamp is invalid', async () => {
    const event = createCallCompletedEvent({
      agentLegs: [
        {
          agent_email: 'agent@voiceops.com',
          started_at: 'not-a-timestamp',
          ended_at: 'still-not-a-timestamp',
          first_name: 'Ava',
          last_name: 'Agent'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('fails when call_started_at is a millisecond timestamp', async () => {
    const event = createCallCompletedEvent({
      call_started_at: '1712683200000'
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow('call_started_at must be a 10-digit Unix timestamp in seconds.')
  })

  it('fails when an agent leg is missing first_name', async () => {
    const event = createCallCompletedEvent({
      agentLegs: [
        {
          agent_email: 'agent@voiceops.com',
          started_at: '2025-12-08T13:32:47.000Z',
          last_name: 'Agent'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('fails when an agent leg is missing last_name', async () => {
    const event = createCallCompletedEvent({
      agentLegs: [
        {
          agent_email: 'agent@voiceops.com',
          started_at: '2025-12-08T13:32:47.000Z',
          first_name: 'Ava'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })

  it('fails when a HANDLING_AGENT channel identifier is not an email address', async () => {
    const event = createCallCompletedEvent({
      channels: [
        {
          channel: 2,
          type: 'HANDLING_AGENT',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: 'agent-123'
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow('channels.identifier must be a valid email address when channels.type is HANDLING_AGENT.')
  })

  it('fails when a HANDLING_AGENT channel identifier has surrounding whitespace', async () => {
    const event = createCallCompletedEvent({
      channels: [
        {
          channel: 2,
          type: 'HANDLING_AGENT',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: ' agent@voiceops.com '
        }
      ]
    })

    await expect(
      testDestination.testAction('sendCallCompleted', {
        event,
        settings: SETTINGS,
        useDefaultMappings: true
      })
    ).rejects.toThrow('channels.identifier must be a valid email address when channels.type is HANDLING_AGENT.')
  })

  it('allows a CONTACT channel identifier that is not an email address', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      channels: [
        {
          channel: 0,
          type: 'CONTACT',
          recording_start_time: '2025-12-08T13:32:47.000Z',
          identifier: 'customer-42'
        }
      ]
    })

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      channels: [
        {
          channel: 0,
          type: 'CONTACT',
          recording_start_time: expect.any(String),
          identifier: 'customer-42'
        }
      ]
    })
  })

  it('allows a TRANSFER_AGENT channel identifier that is not an email address', async () => {
    nock(DEFAULT_VOICEOPS_BASE_URL).post('/frontline-api/integrations/v1/segment/calls').reply(200, {})

    const event = createCallCompletedEvent({
      channels: [
        {
          channel: 2,
          type: 'TRANSFER_AGENT',
          recording_start_time: '2025-12-08T13:35:47.000Z',
          identifier: 'transfer-agent-id'
        }
      ]
    })

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      channels: [
        {
          channel: 2,
          type: 'TRANSFER_AGENT',
          recording_start_time: expect.any(String),
          identifier: 'transfer-agent-id'
        }
      ]
    })
  })

  it('uses a custom base URL when provided in settings', async () => {
    nock('https://custom.projectfrontline.net')
      .post('/frontline-api/integrations/v1/segment/calls')
      .matchHeader('authorization', 'Bearer voiceops-token')
      .reply(200, {})

    const customSettings: Settings = {
      accessToken: 'voiceops-token',
      baseUrl: 'https://custom.projectfrontline.net/'
    }

    const event = createCallCompletedEvent()

    const responses = await testDestination.testAction('sendCallCompleted', {
      event,
      settings: customSettings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })
})
