import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const FLAG = 'actions-reddit-conversions-api-base64-hashing'
const ALICE_HEX = 'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976'
const ALICE_BASE64 = '/42YGfwOEr8NJIkuRZh+JJoo3Og2qFytYOKOqqjG2XY='

const settings: Settings = {
  ad_account_id: 'ad_account_id_1',
  conversion_token: 'conversion_token_1'
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(1704721970212 + 1000)
})

afterEach(() => {
  jest.restoreAllMocks()
  nock.cleanAll()
})

const buildEvent = (messageId: string, email: string) =>
  createTestEvent({
    timestamp,
    event: 'Order Completed',
    messageId,
    type: 'track',
    userId: 'user_id_1',
    properties: {
      click_id: 'click_id_1',
      revenue: 100,
      currency: 'USD',
      products: [{ product_id: 'product_id_1', category: 'category_1', name: 'name_1' }],
      email
    },
    context: { userAgent: 'test-user-agent' }
  })

const v2Mapping = { tracking_type: 'Purchase' }
const v3Mapping = { tracking_type: 'Purchase', api_version: 'v3', action_source: 'WEBSITE' }

const v2Path = '/api/v2.0/conversions/events/ad_account_id_1'
const v3Path = '/api/v3/pixels/ad_account_id_1/conversion_events'

type Json = { events?: Array<{ user: { email?: string } }>; data?: { events: Array<{ user: { email?: string } }> } }
const sentEmails = (json: unknown) => {
  const body = json as Json
  return (body.events ?? body.data?.events ?? []).map((e) => e.user.email)
}

type Case = { name: string; path: string; mapping: Record<string, string>; batch: boolean }

const cases: Case[] = [
  { name: 'V2 perform', path: v2Path, mapping: v2Mapping, batch: false },
  { name: 'V2 performBatch', path: v2Path, mapping: v2Mapping, batch: true },
  { name: 'V3 perform', path: v3Path, mapping: v3Mapping, batch: false },
  { name: 'V3 performBatch', path: v3Path, mapping: v3Mapping, batch: true }
]

const run = async (c: Case, email: string, features?: Record<string, boolean>): Promise<unknown> => {
  nock('https://ads-api.reddit.com').post(c.path).reply(200, {})
  const args = { settings, features, useDefaultMappings: true, mapping: c.mapping }
  const responses = c.batch
    ? await testDestination.testBatchAction('standardEvent', { ...args, events: [buildEvent('msg-1', email)] })
    : await testDestination.testAction('standardEvent', { ...args, event: buildEvent('msg-1', email) })
  expect(responses[0].status).toBe(200)
  return responses[0].options.json
}

describe.each(cases)('Base64 hashing flag - $name', (c: Case) => {
  it('lowercases a pre-hashed uppercase email when the flag is on', async () => {
    const json = await run(c, ALICE_HEX.toUpperCase(), { [FLAG]: true })
    expect(sentEmails(json)).toEqual([ALICE_HEX])
  })

  it('leaves a pre-hashed uppercase email as is when the flag is off', async () => {
    const json = await run(c, ALICE_HEX.toUpperCase(), { [FLAG]: false })
    expect(sentEmails(json)).toEqual([ALICE_HEX.toUpperCase()])
  })

  it('leaves a pre-hashed uppercase email as is when features is not set', async () => {
    const json = await run(c, ALICE_HEX.toUpperCase())
    expect(sentEmails(json)).toEqual([ALICE_HEX.toUpperCase()])
  })

  it('converts a Base64 email to hex when the flag is on', async () => {
    const json = await run(c, ALICE_BASE64, { [FLAG]: true })
    expect(sentEmails(json)).toEqual([ALICE_HEX])
  })
})
