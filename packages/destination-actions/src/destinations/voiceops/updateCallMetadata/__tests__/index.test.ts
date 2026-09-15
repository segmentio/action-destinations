import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'
import { DEFAULT_VOICEOPS_BASE_URL } from '../../constants'
import type { Settings } from '../../generated-types'

const testDestination = createTestIntegration(destination)
const settings = { accessToken: 'voiceops-token', baseUrl: DEFAULT_VOICEOPS_BASE_URL }
const endpoint = '/frontline-api/integrations/v1/segment/metadata'

function sendMetadata(properties: Record<string, unknown> = {}) {
  return testDestination.testAction('updateCallMetadata', {
    settings,
    useDefaultMappings: true,
    event: createTestEvent({
      event: 'call.completed',
      properties: {
        call_id: 'call-123',
        completed_at: 1789394517,
        extraMetadata: { disposition: 'Appointment Set' },
        ...properties
      }
    })
  })
}

describe('Voiceops.updateCallMetadata', () => {
  it('sends metadata without recording fields and normalizes numeric completion seconds', async () => {
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
      .post(endpoint, {
        call_id: 'call-123',
        call_completed_at: '1789394517',
        extraMetadata: { disposition: 'Appointment Set' }
      })
      .matchHeader('authorization', 'Bearer voiceops-token')
      .matchHeader('user-agent', 'Segment')
      .reply(200, { status: 'success' })

    const responses = await sendMetadata()

    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe(200)
    expect(scope.isDone()).toBe(true)
  })

  it('supports an explicit mapping from raw Regal completion properties', async () => {
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
      .post(endpoint, {
        call_id: 'call-123',
        call_completed_at: '1789394517',
        extraMetadata: { disposition: 'Call Failed', attempt: 0, connected: false }
      })
      .reply(200, {})

    await testDestination.testAction('updateCallMetadata', {
      settings,
      useDefaultMappings: true,
      event: createTestEvent({
        event: 'call.completed',
        properties: {
          call_id: 'call-123',
          completed_at: 1789394517,
          agent_email: null,
          started_at: null,
          disposition: 'Call Failed',
          dialer_attempt: 0,
          conversation_happened: false
        }
      }),
      mapping: {
        extraMetadata: {
          disposition: { '@path': '$.properties.disposition' },
          attempt: { '@path': '$.properties.dialer_attempt' },
          connected: { '@path': '$.properties.conversation_happened' }
        }
      }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('prefers the canonical completion timestamp and forwards nested metadata unchanged', async () => {
    const extraMetadata = { disposition: 'Answered', details: { tags: ['sales'], score: 0, connected: false } }
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
      .post(endpoint, { call_id: 'call-123', call_completed_at: '1789394600', extraMetadata })
      .reply(200, {})

    await sendMetadata({ call_completed_at: '1789394600', extraMetadata })

    expect(scope.isDone()).toBe(true)
  })

  it.each(['call_id', 'completed_at', 'extraMetadata'])(
    'rejects missing %s before sending a request',
    async (field) => {
      const scope = nock(DEFAULT_VOICEOPS_BASE_URL).post(endpoint).reply(200, {})

      await expect(sendMetadata({ [field]: undefined })).rejects.toThrow(/required field/)
      expect(scope.isDone()).toBe(false)
    }
  )

  it.each(['', '1789394517000', '2026-09-14T14:00:00Z', 'invalid'])(
    'rejects invalid completion time %p',
    async (value) => {
      await expect(sendMetadata({ completed_at: value })).rejects.toThrow()
    }
  )

  it.each(['bad/id', ' ', 'x'.repeat(101)])('rejects invalid call ID %p', async (call_id) => {
    await expect(sendMetadata({ call_id })).rejects.toThrow(
      'call_id must contain 1 to 100 letters, numbers, dots, hyphens, or underscores.'
    )
  })

  it('rejects an empty metadata snapshot', async () => {
    await expect(sendMetadata({ extraMetadata: {} })).rejects.toThrow(
      'extraMetadata must contain at least one metadata field.'
    )
  })

  it.each([
    'call_id',
    'call_started_at',
    'recording_url',
    'agent_email',
    'channels',
    'agentLegs',
    'voiceops_segment_source_call_id',
    'source'
  ])('rejects reserved metadata field %s', async (field) => {
    await expect(sendMetadata({ extraMetadata: { [field]: null } })).rejects.toThrow(
      `extraMetadata must not contain the reserved field '${field}'.`
    )
  })

  it('uses the configured base URL and removes trailing slashes', async () => {
    const scope = nock('https://staging.example.com').post(endpoint).reply(200, {})

    await testDestination.testAction('updateCallMetadata', {
      settings: { ...settings, baseUrl: 'https://staging.example.com///' },
      mapping: {
        call_id: 'call-123',
        call_completed_at: '1789394517',
        extraMetadata: { disposition: 'Answered' }
      }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('uses the default base URL when the setting is omitted', async () => {
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
      .post(endpoint)
      .matchHeader('authorization', 'Bearer voiceops-token')
      .reply(200, {})

    const legacySettings: Settings = { accessToken: 'voiceops-token' }
    const responses = await testDestination.testAction('updateCallMetadata', {
      settings: legacySettings,
      mapping: {
        call_id: 'call-123',
        call_completed_at: '1789394517',
        extraMetadata: { disposition: 'Answered' }
      }
    })

    expect(responses[0].status).toBe(200)
    expect(scope.isDone()).toBe(true)
  })

  it.each([400, 401, 429, 500])('propagates HTTP %s for standard error handling', async (status: number) => {
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL).post(endpoint).reply(status, { error: 'Request failed' })

    await expect(sendMetadata()).rejects.toThrow()
    expect(scope.isDone()).toBe(true)
  })
})
