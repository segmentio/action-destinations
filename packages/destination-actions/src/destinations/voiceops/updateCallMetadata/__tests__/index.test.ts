import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'
import action from '../index'
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
      event: 'Call Completed',
      properties: {
        call_id: 'call-123',
        call_completed_at: 1789394517,
        extra_metadata: { disposition: 'Appointment Set' },
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
        call_completed_at: { '@path': '$.properties.completed_at' },
        extraMetadata: {
          disposition: { '@path': '$.properties.disposition' },
          attempt: { '@path': '$.properties.dialer_attempt' },
          connected: { '@path': '$.properties.conversation_happened' }
        }
      }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('uses canonical properties and forwards nested metadata unchanged', async () => {
    const extraMetadata = { disposition: 'Answered', details: { tags: ['sales'], score: 0, connected: false } }
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
      .post(endpoint, { call_id: 'call-123', call_completed_at: '1789394600', extraMetadata })
      .reply(200, {})

    await sendMetadata({ call_completed_at: '1789394600', extra_metadata: extraMetadata, completed_at: 1789394517 })

    expect(scope.isDone()).toBe(true)
  })

  it.each(['call_id', 'call_completed_at', 'extra_metadata'])(
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
      await expect(sendMetadata({ call_completed_at: value })).rejects.toThrow()
    }
  )

  it.each(['bad/id', ' ', 'x'.repeat(101)])('rejects invalid call ID %p', async (call_id) => {
    await expect(sendMetadata({ call_id })).rejects.toThrow(
      'call_id must contain 1 to 100 letters, numbers, dots, hyphens, or underscores.'
    )
  })

  it('rejects an empty metadata snapshot', async () => {
    await expect(sendMetadata({ extra_metadata: {} })).rejects.toThrow(
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
    await expect(sendMetadata({ extra_metadata: { [field]: null } })).rejects.toThrow(
      `extraMetadata must not contain the reserved field '${field}'.`
    )
  })

  it.each([null, undefined, [], ['disposition'], 'Answered', 42, true])(
    'rejects invalid metadata shape %p even when invoked without schema validation',
    (extraMetadata) => {
      const request = jest.fn()
      const data = {
        settings,
        payload: { call_id: 'call-123', call_completed_at: '1789394517', extraMetadata }
      } as unknown as Parameters<NonNullable<typeof action.perform>>[1]

      expect(() => action.perform(request, data)).toThrow('extraMetadata must be an object.')
      expect(request).not.toHaveBeenCalled()
    }
  )

  it('serializes IDs and completion timestamps as strings even without schema coercion', async () => {
    const request = jest.fn().mockResolvedValue({})
    const data = {
      settings,
      payload: { call_id: 123, call_completed_at: 1789394517, extraMetadata: { disposition: 'Answered' } }
    } as unknown as Parameters<NonNullable<typeof action.perform>>[1]

    await action.perform(request, data)

    expect(request).toHaveBeenCalledWith(`${DEFAULT_VOICEOPS_BASE_URL}${endpoint}`, {
      method: 'post',
      json: { call_id: '123', call_completed_at: '1789394517', extraMetadata: { disposition: 'Answered' } }
    })
  })

  it('requires explicit mapping for the Regal completed_at property', async () => {
    await expect(sendMetadata({ call_completed_at: undefined, completed_at: 1789394517 })).rejects.toThrow(
      /required field/
    )
  })

  it.each(['not a url', '/relative', 'ftp://example.com'])('rejects an invalid base URL %p', async (baseUrl) => {
    await expect(
      testDestination.testAction('updateCallMetadata', {
        settings: { ...settings, baseUrl },
        mapping: {
          call_id: 'call-123',
          call_completed_at: '1789394517',
          extraMetadata: { disposition: 'Answered' }
        }
      })
    ).rejects.toThrow('Base URL must be a valid HTTP or HTTPS URL.')
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

  it.each([undefined, '', ' \t\n '])(
    'uses the default base URL for an omitted or blank setting %p',
    async (baseUrl) => {
      const scope = nock(DEFAULT_VOICEOPS_BASE_URL)
        .post(endpoint)
        .matchHeader('authorization', 'Bearer voiceops-token')
        .reply(200, {})

      const legacySettings: Settings = { accessToken: 'voiceops-token', baseUrl }
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
    }
  )

  it.each([400, 401, 429, 500])('propagates HTTP %s for standard error handling', async (status: number) => {
    const scope = nock(DEFAULT_VOICEOPS_BASE_URL).post(endpoint).reply(status, { error: 'Request failed' })

    await expect(sendMetadata()).rejects.toThrow()
    expect(scope.isDone()).toBe(true)
  })
})
