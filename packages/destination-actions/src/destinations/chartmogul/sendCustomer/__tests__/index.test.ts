import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const CHARTMOGUL_WEBHOOK_URL = 'https://chartmogul.webhook.endpoint'
const testDestination = createTestIntegration(Destination)

describe('Chartmogul.sendCustomer', () => {
  it('validates action fields', async () => {
    try {
      await testDestination.testAction('sendCustomer', {
        settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
      })
    } catch (err: any) {
      expect(err.message).toContain("missing the required field 'type'.")
      expect(err.message).toContain("missing the required field 'message_id'.")
      expect(err.message).toContain("missing the required field 'timestamp'.")
      expect(err.message).toContain("missing the required field 'sent_at'.")
      expect(err.message).toContain("missing the required field 'group_id'.")
      expect(err.message).toContain("missing the required field 'user_id'.")
    }
  })

  it('processes valid input', async () => {
    const mapping = {
      type: 'Send Customer',
      message_id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      sent_at: '2024-01-01T10:01:00Z',
      group_id: 'g1',
      user_id: 'u1',
      name: 'Soft Tech'
    }

    nock(CHARTMOGUL_WEBHOOK_URL).post('/', mapping).reply(200, {})

    await testDestination.testAction('sendCustomer', {
      mapping: mapping,
      settings: { chartmogul_webhook_url: CHARTMOGUL_WEBHOOK_URL }
    })
  })
})
