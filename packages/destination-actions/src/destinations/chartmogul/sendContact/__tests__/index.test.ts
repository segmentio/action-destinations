import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const CHARTMOGUL_WEBHOOK_URL = 'https://chartmogul.webhook.endpoint'
const MINIMAL_MAPPING = {
  type: 'Send Contact',
  message_id: '1',
  timestamp: '2024-01-01T10:00:00Z',
  sent_at: '2024-01-01T10:01:00Z'
}

const testDestination = createTestIntegration(Destination)

describe('Chartmogul.sendContact', () => {
  it('validates action fields', async () => {
    try {
      await testDestination.testAction('sendContact', {
        settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
      })
    } catch (err: any) {
      expect(err.message).toContain("missing the required field 'type'.")
      expect(err.message).toContain("missing the required field 'message_id'.")
      expect(err.message).toContain("missing the required field 'timestamp'.")
      expect(err.message).toContain("missing the required field 'sent_at'.")
    }
  })

  it('requires user_id or anonymous_id', async () => {
    try {
      await testDestination.testAction('sendContact', {
        mapping: { ...MINIMAL_MAPPING },
        settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
      })
    } catch (err: any) {
      expect(err.message).toContain('The user_id and/or anonymous_id must be present.')
    }
  })

  it('requires more than the required fields and the user_id', async () => {
    try {
      await testDestination.testAction('sendContact', {
        mapping: { ...MINIMAL_MAPPING, user_id: 'u1' },
        settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
      })
    } catch (err: any) {
      expect(err.message).toContain('The event contains no information of interest to Chartmogul.')
    }
  })

  it('requires more than the required fields and the anonymous_id', async () => {
    try {
      await testDestination.testAction('sendContact', {
        mapping: { ...MINIMAL_MAPPING, anonymous_id: 'a1' },
        settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
      })
    } catch (err: any) {
      expect(err.message).toContain('The event contains no information of interest to Chartmogul.')
    }
  })

  it('accepts the required fields, the user_id and the anonymous_id', async () => {
    const mapping = { ...MINIMAL_MAPPING, user_id: 'u1', anonymous_id: 'a1' }
    nock(CHARTMOGUL_WEBHOOK_URL).post('/', mapping).reply(200, {})

    await testDestination.testAction('sendContact', {
      mapping: mapping,
      settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
    })
  })

  it('removes from the payload companies without id', async () => {
    const mapping = {
      ...MINIMAL_MAPPING,
      user_id: 'u1',
      anonymous_id: 'a1',
      name: 'John Doe',
      company: { name: 'Soft Tech' }
    }
    const optimized_mapping = { ...MINIMAL_MAPPING, user_id: 'u1', anonymous_id: 'a1', name: 'John Doe' }

    nock(CHARTMOGUL_WEBHOOK_URL).post('/', optimized_mapping).reply(200, {})

    await testDestination.testAction('sendContact', {
      mapping: mapping,
      settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
    })
  })
})
