import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendConversion'
const NOW = Date.parse('2026-11-03T12:00:00.000Z')
const settings = { pixel_id: 'pix_123', api_key: 'key_abc' }

const sentBody = async (mapping: Record<string, unknown>) => {
  nock(/.*/).persist().post(/.*/).reply(200)
  const responses = await testDestination.testAction(actionSlug, {
    event: createTestEvent(),
    mapping,
    settings,
    auth: undefined
  })
  return JSON.parse(await responses[0].request.text())
}

describe(`Testing snapshot for ${destination.name}'s ${actionSlug} destination action:`, () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.restoreAllMocks()
  })

  it('required fields', async () => {
    expect(
      await sentBody({
        event_type: 'lead_created',
        event_id: 'evt_required',
        timestamp: '2026-11-03T11:59:00.000Z',
        action_source: 'other',
        user: { email: ['jane@example.com'] }
      })
    ).toMatchSnapshot()
  })

  it('all fields', async () => {
    expect(
      await sentBody({
        event_type: 'order_created',
        event_id: 'evt_all',
        timestamp: '2026-11-03T11:59:00.000Z',
        action_source: 'web',
        source_url: 'https://example.com/thanks',
        oppref: 'opp_123',
        opt_out: true,
        amount: 25.99,
        currency: 'USD',
        contents: [
          {
            id: 'sku_1',
            group_id: 'group_1',
            name: 'Shirt',
            content_type: 'product',
            quantity: 2,
            amount: 10.5,
            currency: 'USD',
            color: 'blue'
          },
          { id: 'sku_2', name: 'Hat', quantity: 1, amount: 4.99 }
        ],
        user: {
          email: ['jane@example.com', 'Jane.Doe@Example.com'],
          phone: ['+1 415 555 0100'],
          android_advertising_id: '11111111-2222-3333-4444-555555555555',
          obref: 'obr_123',
          external_id: 'user_1',
          user_agent: 'Mozilla/5.0',
          ip_address: '203.0.113.9',
          first_name: 'Jane',
          last_name: 'Doe',
          city: 'Austin',
          region: 'Texas',
          country: 'US',
          postal_code: '78701'
        }
      })
    ).toMatchSnapshot()
  })
})
