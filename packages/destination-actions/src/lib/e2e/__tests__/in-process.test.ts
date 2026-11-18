// The InProcessAdapter end to end on the registered suites, with the partners mocked by nock.
import nock from 'nock'
import { MultiStatusResponse } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { E2ESuite } from '../types'
import { InProcessAdapter } from '../adapters/in-process'
import { buildInvocation } from '../invocation'
import { runSuites } from '../run'
import { suites } from '../../../destinations/mixpanel/__e2e__'
import { suites as webhookSuites } from '../../../destinations/webhook/__e2e__'

describe('InProcessAdapter on the Webhook suite', () => {
  it('passes success, failure and error fixtures', async () => {
    // Echo the request body back the way httpbin's /anything does.
    const echo = (method: string) => (_uri: string, body: unknown) => [200, { method, json: body }] as [number, unknown]
    nock('https://httpbin.org').persist().post('/anything').reply(echo('POST')).put('/anything').reply(echo('PUT'))
    nock('https://httpbin.org').post('/status/404').reply(404, '')

    const report = await runSuites(new InProcessAdapter(), webhookSuites, { env: {} })
    nock.cleanAll()

    expect(report.results.map((r) => [r.fixture, r.outcome, r.reason])).toEqual(
      webhookSuites[0].fixtures.map((fixture) => [fixture.description, 'passed', undefined])
    )
    expect(report.exitCode).toBe(0)
  })
})

const env = { E2E_MIXPANEL_PROJECT_TOKEN: 'test-token', E2E_MIXPANEL_API_SECRET: 'test-secret' }
const auth = `Basic ${Buffer.from('test-secret:').toString('base64')}`
// The adapter must send resolved settings and the mapped events, not just reach the right path.
type SentEvent = { event?: unknown; properties?: { $insert_id?: unknown } }
const mappedEvents = (body: unknown) =>
  Array.isArray(body) &&
  body.length > 0 &&
  (body as SentEvent[]).every(
    (e) => typeof e.event === 'string' && e.event.startsWith('E2E ') && typeof e.properties?.$insert_id === 'string'
  )

describe('InProcessAdapter on the Mixpanel suite', () => {
  it('passes every fixture when Mixpanel accepts the events', async () => {
    nock('https://api.mixpanel.com')
      .matchHeader('authorization', auth)
      .post('/import?strict=1', mappedEvents)
      .times(3)
      .reply(200, { code: 200, status: 'OK', num_records_imported: 2 })

    const report = await runSuites(new InProcessAdapter(), suites, { env })

    expect(report.results.map((r) => [r.fixture, r.outcome, r.reason])).toEqual(
      suites[0].fixtures.map((fixture) => [fixture.description, 'passed', undefined])
    )
    expect(report.exitCode).toBe(0)
    expect(nock.isDone()).toBe(true)
  })

  it('reports the partner exchange when Mixpanel rejects the request', async () => {
    nock('https://api.mixpanel.com').post('/import?strict=1').reply(401, { error: 'Invalid API secret', status: 0 })

    const [suite] = suites
    const fixture = suite.fixtures.find((f) => f.mode === 'single' && f.expect.status === 'success')
    if (!fixture) throw new Error('the Mixpanel suite has no single success fixture')
    const report = await runSuites(new InProcessAdapter(), [{ ...suite, fixtures: [fixture] }], { env })

    expect(report.results[0].outcome).toBe('failed')
    expect(report.results[0].reason).toMatch(/^expected success, got .+\(401\)/)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(401, { error: 'Invalid API secret', status: 0 })
    const observation = await new InProcessAdapter().run(buildInvocation(suite, fixture, env), suite)
    expect(observation.exchanges).toEqual([
      expect.objectContaining({ method: 'POST', status: 401, body: { error: 'Invalid API secret', status: 0 } })
    ])
  })

  it('returns per-event multistatus when the mixpanel-multistatus flag is on', async () => {
    nock('https://api.mixpanel.com')
      .matchHeader('authorization', auth)
      .post('/import?strict=1', mappedEvents)
      .reply(400, {
        code: 400,
        status: 'Bad Request',
        num_records_imported: 1,
        failed_records: [{ index: 1, insert_id: 'x', field: 'time', message: 'bad' }]
      })

    const [suite] = suites
    const fixture = suite.fixtures.find((f) => f.mode === 'batchWithMultistatus')
    if (!fixture) throw new Error('the Mixpanel suite has no batchWithMultistatus fixture')
    const observation = await new InProcessAdapter().run(buildInvocation(suite, fixture, env), suite)

    // Only the flag's path splits one response into per-event results; without it this would throw.
    expect(observation.error).toBeUndefined()
    expect(observation.multistatus?.map((item) => [item.status, item.errormessage])).toEqual([
      [200, undefined],
      [400, 'bad']
    ])
  })
})

describe('batchWithMultistatus on a destination without per-event results', () => {
  it('fails when performBatch returned a plain response', async () => {
    nock('https://httpbin.org').post('/anything').reply(200, { json: [] })
    const [suite] = webhookSuites
    const fixture = suite.fixtures.find((f) => f.mode === 'batch')
    if (!fixture) throw new Error('the Webhook suite has no batch fixture')
    const asMultistatus = { ...fixture, mode: 'batchWithMultistatus' as const, expect: { status: 'success' as const } }

    const report = await runSuites(new InProcessAdapter(), [{ ...suite, retries: 0, fixtures: [asMultistatus] }], {
      env: {}
    })
    nock.cleanAll()

    expect(report.results[0].outcome).toBe('failed')
    expect(report.results[0].reason).toBe(
      'performBatch did not return a MultiStatusResponse, so per-event results only copy one response'
    )
  })

  it('fails the Mixpanel multistatus fixture when its flag is off', async () => {
    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, { code: 200, status: 'OK' })
    const [suite] = suites
    const fixture = suite.fixtures.find((f) => f.mode === 'batchWithMultistatus')
    if (!fixture) throw new Error('the Mixpanel suite has no batchWithMultistatus fixture')

    const report = await runSuites(new InProcessAdapter(), [{ ...suite, fixtures: [{ ...fixture, features: {} }] }], {
      env
    })
    nock.cleanAll()

    expect(report.results[0].reason).toMatch(/^performBatch did not return a MultiStatusResponse/)
  })
})

describe('OAuth refresh and hooks through InProcessAdapter', () => {
  // An oauth2 destination whose API answers 401 to any token but 'fresh'.
  const definition: DestinationDefinition<{ region: string }> = {
    name: 'Fake OAuth',
    slug: 'actions-fake-oauth',
    mode: 'cloud',
    authentication: {
      scheme: 'oauth2',
      fields: { region: { label: 'Region', description: 'Region', type: 'string' } },
      refreshAccessToken: async (request, { auth }) => {
        const res = await request<{ access_token: string }>('https://auth.fake.test/token', {
          method: 'POST',
          json: { refresh_token: auth.refreshToken }
        })
        return { accessToken: res.data.access_token }
      }
    },
    extendRequest: ({ settings, auth }) => ({
      headers: { authorization: `Bearer ${auth?.accessToken}`, 'x-region': settings.region }
    }),
    actions: {
      send: {
        title: 'Send',
        description: 'Send',
        fields: { name: { label: 'Name', description: 'Name', type: 'string', default: { '@path': '$.event' } } },
        perform: (request, { payload }) => request('https://api.fake.test/send', { method: 'POST', json: payload })
      }
    }
  }
  const env = { E2E_FAKE_REFRESH: 'long-lived' }
  const oauthSuite = (fixtures: E2ESuite['fixtures'], extra: Partial<E2ESuite> = {}): E2ESuite => ({
    destination: 'fake-oauth',
    action: 'send',
    definition,
    config: {
      settings: { region: 'eu', oauth: { access_token: 'stale', refresh_token: { $env: 'E2E_FAKE_REFRESH' } } }
    },
    fixtures,
    ...extra
  })
  const send = (description: string, expect: E2ESuite['fixtures'][number]['expect']) =>
    ({
      description,
      mode: 'single',
      subscribe: 'type = "track"',
      event: { type: 'track', event: description, messageId: '$guid', timestamp: '$now' },
      mapping: {},
      expect
    } as E2ESuite['fixtures'][number])

  afterEach(() => nock.cleanAll())

  it('refreshes once on a 401, then reuses the new token for the rest of the suite', async () => {
    const token = nock('https://auth.fake.test')
      .post('/token', { refresh_token: 'long-lived' })
      .once()
      .reply(200, { access_token: 'fresh' })
    nock('https://api.fake.test')
      .persist()
      .post('/send')
      .reply(function () {
        return String(this.req.headers.authorization) === 'Bearer fresh'
          ? [200, { ok: true }]
          : [401, { message: 'expired' }]
      })

    const report = await runSuites(
      new InProcessAdapter(),
      [
        oauthSuite([
          send('first call refreshes', { status: 'success', exchangeCount: 2, jsonContains: { ok: true } }),
          send('second call reuses the token', { status: 'success', exchangeCount: 1 })
        ])
      ],
      { env }
    )

    expect(report.results.map((r) => [r.fixture, r.outcome, r.reason])).toEqual([
      ['first call refreshes', 'passed', undefined],
      ['second call reuses the token', 'passed', undefined]
    ])
    expect(token.isDone()).toBe(true)
  })

  it('names a failed refresh', async () => {
    nock('https://auth.fake.test').post('/token').reply(400, { error: 'invalid_grant' })
    nock('https://api.fake.test').post('/send').reply(401, { message: 'expired' })

    const report = await runSuites(
      new InProcessAdapter(),
      [oauthSuite([send('refresh fails', { status: 'success' })])],
      {
        env
      }
    )

    expect(report.exitCode).toBe(1)
    expect(report.results[0].reason).toMatch(/OAuth refresh failed: re-authorize the sandbox app/)
  })

  it("gives hooks the destination's own request client, with a refreshed token", async () => {
    nock('https://auth.fake.test')
      .post('/token', { refresh_token: 'long-lived' })
      .once()
      .reply(200, { access_token: 'fresh' })
    const created = nock('https://api.fake.test', { reqheaders: { authorization: 'Bearer fresh', 'x-region': 'eu' } })
      .post('/lists', { name: 'e2e-run1' })
      .reply(201, { id: 'list-1' })
      .delete('/lists/list-1')
      .reply(204)
    nock('https://api.fake.test').post('/send', { name: 'list-1' }).reply(200, { ok: true })

    const fixture = { ...send('uses the list', { status: 'success' }), mapping: { name: '$before:listId' } }
    const report = await runSuites(
      new InProcessAdapter(),
      [
        oauthSuite([fixture], {
          before: async ({ request, runId }) => {
            const res = await request<{ id: string }>('https://api.fake.test/lists', {
              method: 'POST',
              json: { name: `e2e-${runId}` }
            })
            return { listId: res.data.id }
          },
          after: async ({ request, values }) => {
            await request(`https://api.fake.test/lists/${values.listId}`, { method: 'DELETE' })
          }
        })
      ],
      { env, runId: 'run1' }
    )

    expect(report.results.map((r) => [r.outcome, r.reason])).toEqual([['passed', undefined]])
    expect(report.warnings).toEqual([])
    expect(created.isDone()).toBe(true)
  })

  it('makes a failed refresh before hooks a setup error', async () => {
    nock('https://auth.fake.test').post('/token').reply(400, { error: 'invalid_grant' })
    const report = await runSuites(
      new InProcessAdapter(),
      [oauthSuite([send('never runs', { status: 'success' })], { before: async () => ({}) })],
      { env }
    )

    expect(report.exitCode).toBe(2)
    expect(report.results).toEqual([])
    expect(report.setupErrors[0]).toMatch(/fake-oauth\/send: OAuth refresh failed: re-authorize the sandbox app/)
  })

  it('names a failed refresh in batch mode, after multistatus 401s', async () => {
    nock('https://auth.fake.test').post('/token').reply(400, { error: 'invalid_grant' })
    nock('https://api.fake.test').post('/batch').reply(200, { ok: true })
    const batchDefinition: DestinationDefinition<{ region: string }> = {
      ...definition,
      actions: {
        send: {
          ...definition.actions.send,
          performBatch: async (request, { payload }) => {
            await request('https://api.fake.test/batch', { method: 'POST', json: payload })
            const response = new MultiStatusResponse()
            payload.forEach(() => response.pushErrorResponse({ status: 401, errormessage: 'expired' }))
            return response
          }
        }
      }
    }
    const fixture = {
      ...send('batch refresh fails', { status: 'error', errorType: 'OAUTH_REFRESH_FAILED' }),
      mode: 'batchWithMultistatus',
      events: [{ type: 'track', event: 'a', messageId: '$guid', timestamp: '$now' }]
    } as unknown as E2ESuite['fixtures'][number]
    const report = await runSuites(
      new InProcessAdapter(),
      [{ ...oauthSuite([fixture]), definition: batchDefinition }],
      { env }
    )

    expect(report.results.map((r) => [r.outcome, r.reason])).toEqual([['passed', undefined]])
  })
})
