import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { getAdId, getUser } from '../utils'

const testDestination = createTestIntegration(Definition)
const FLAG = 'actions-reddit-conversions-api-base64-hashing'
const ALICE_HEX = 'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976'
const IDFA_HEX = '70574fa9c8f498a7b2e5c8712b1126de7b1406fd02fdc591821c5bd33092fd1c'

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

const buildEvent = (email: string) =>
  createTestEvent({
    timestamp: '2024-01-08T13:52:50.212Z',
    event: 'Order Completed',
    messageId: 'msg-1',
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

type Case = { name: string; path: string; mapping: Record<string, string>; batch: boolean }
type Json = { events?: Array<{ user: { email?: string } }>; data?: { events: Array<{ user: { email?: string } }> } }

const v2 = { path: '/api/v2.0/conversions/events/ad_account_id_1', mapping: { tracking_type: 'Purchase' } }
const v3 = {
  path: '/api/v3/pixels/ad_account_id_1/conversion_events',
  mapping: { tracking_type: 'Purchase', api_version: 'v3', action_source: 'WEBSITE' }
}

const cases: Case[] = [
  { name: 'V2 perform', ...v2, batch: false },
  { name: 'V2 performBatch', ...v2, batch: true },
  { name: 'V3 perform', ...v3, batch: false },
  { name: 'V3 performBatch', ...v3, batch: true }
]

const sentEmail = async (c: Case, email: string, features?: Record<string, boolean>) => {
  nock('https://ads-api.reddit.com').post(c.path).reply(200, {})
  const args = { settings, features, useDefaultMappings: true, mapping: c.mapping }
  const responses = c.batch
    ? await testDestination.testBatchAction('standardEvent', { ...args, events: [buildEvent(email)] })
    : await testDestination.testAction('standardEvent', { ...args, event: buildEvent(email) })
  const body = responses[0].options.json as Json
  return (body.events ?? body.data?.events ?? [])[0].user.email
}

describe.each(cases)('Base64 hashing flag - $name', (c: Case) => {
  it('lowercases a pre-hashed uppercase email when the flag is on', async () => {
    expect(await sentEmail(c, ALICE_HEX.toUpperCase(), { [FLAG]: true })).toBe(ALICE_HEX)
  })

  it('leaves a pre-hashed uppercase email as is when the flag is off or not set', async () => {
    expect(await sentEmail(c, ALICE_HEX.toUpperCase(), { [FLAG]: false })).toBe(ALICE_HEX.toUpperCase())
    expect(await sentEmail(c, ALICE_HEX.toUpperCase())).toBe(ALICE_HEX.toUpperCase())
  })
})

describe('Base64 hashing flag off - utils', () => {
  it('getUser keeps legacy hashing when called without the flag', () => {
    const user = getUser(
      { email: ALICE_HEX.toUpperCase(), device_type: 'ios', advertising_id: IDFA_HEX.toUpperCase() },
      undefined,
      undefined
    )
    expect(user).toMatchObject({ email: ALICE_HEX.toUpperCase(), idfa: IDFA_HEX.toUpperCase() })
  })

  it('getAdId keeps legacy hashing when called without the flag', () => {
    expect(getAdId('ios', IDFA_HEX.toUpperCase())).toEqual({ idfa: IDFA_HEX.toUpperCase() })
  })
})
