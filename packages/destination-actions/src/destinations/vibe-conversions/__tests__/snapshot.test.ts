import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-vibe-conversions'

// Fixed clock + timestamp so the request body (and the 7-day window check) are deterministic.
const FIXED_NOW = new Date('2026-07-03T00:00:00.000Z').getTime()
const FIXED_TS = '2026-07-02T00:00:00.000Z'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => FIXED_NOW)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  const settings = { aid: 'pixel_123' }

  it('trackConversion action - required fields', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      event: 'Order Completed',
      timestamp: FIXED_TS,
      messageId: 'msg_fixed_1',
      properties: {}
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { a: 'purchase' }
    })

    const request = responses[0].request
    const rawBody = await request.text()
    expect(JSON.parse(rawBody)).toMatchSnapshot()
    expect(request.headers).toMatchSnapshot()
  })

  it('trackConversion action - all fields', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      event: 'Order Completed',
      timestamp: FIXED_TS,
      messageId: 'msg_fixed_2',
      context: {
        ip: '8.8.8.8',
        userAgent: 'test-agent',
        traits: { email: 'joe@gmail.com' },
        page: { url: 'https://www.whatever.com' }
      },
      properties: { price_usd: 50.5, purchase_id: 'pid_123' }
    })

    const responses = await testDestination.testAction('trackConversion', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { a: 'purchase', gid: 'GA.234.234234' }
    })

    const request = responses[0].request
    const rawBody = await request.text()
    expect(JSON.parse(rawBody)).toMatchSnapshot()
  })
})
