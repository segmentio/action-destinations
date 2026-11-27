// The InProcessAdapter end to end on a fake destination defined here, with its API mocked by nock.
import nock from 'nock'
import { MultiStatusResponse } from '@segment/actions-core'
import type { DestinationDefinition } from '@segment/actions-core'
import type { CTFixture, CTSuite } from '../types'
import { InProcessAdapter } from '../adapters/in-process'
import { buildInvocation } from '../invocation'
import { runSuites } from '../run'

// An API-key destination; with the 'fake-multistatus' flag, performBatch returns per-event results.
const fakeApi: DestinationDefinition<{ apiKey: string }> = {
  name: 'Fake API',
  slug: 'actions-fake-api',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: { apiKey: { label: 'API Key', description: 'API Key', type: 'password', required: true } }
  },
  extendRequest: ({ settings }) => ({ headers: { 'x-api-key': settings.apiKey } }),
  actions: {
    send: {
      title: 'Send',
      description: 'Send',
      fields: {
        name: { label: 'Name', description: 'Name', type: 'string', required: true, default: { '@path': '$.event' } },
        id: { label: 'Id', description: 'Id', type: 'string', default: { '@path': '$.messageId' } }
      },
      perform: (request, { payload }) => request('https://api.fake.test/send', { method: 'POST', json: payload }),
      performBatch: async (request, { payload, features }) => {
        const response = await request<{ results: { status: number; message?: string }[] }>(
          'https://api.fake.test/batch',
          { method: 'POST', json: payload, throwHttpErrors: false }
        )
        if (!features?.['fake-multistatus']) return response
        const multistatus = new MultiStatusResponse()
        response.data.results.forEach(({ status, message }, i) =>
          status < 300
            ? multistatus.setSuccessResponseAtIndex(i, { status, body: 'ok', sent: payload[i] })
            : multistatus.setErrorResponseAtIndex(i, { status, errormessage: message ?? '', sent: payload[i] })
        )
        return multistatus
      }
    }
  }
}

const env = { CT_FAKE_API_KEY: 'secret' }
const event = (name?: string) => ({
  type: 'track',
  ...(name ? { event: name } : {}),
  messageId: '$guid',
  timestamp: '$now'
})
const fixture = (description: string, rest: Partial<CTFixture>): CTFixture =>
  ({
    description,
    mode: 'single',
    subscribe: 'type = "track"',
    event: event(description),
    mapping: {},
    ...rest
  } as CTFixture)
const apiSuite = (fixtures: CTFixture[]): CTSuite => ({
  destination: 'fake-api',
  action: 'send',
  definition: fakeApi,
  config: { settings: { apiKey: { $env: 'CT_FAKE_API_KEY' } } },
  fixtures
})

const accepted = fixture('accepted', { expect: { status: 'success', jsonContains: { ok: true } } })
const rejected = fixture('rejected', { expect: { status: 'failure', httpStatus: 404 } })
const invalid = fixture('invalid', {
  event: event(),
  expect: {
    status: 'error',
    errorType: 'PAYLOAD_VALIDATION_FAILED',
    httpStatus: 400,
    errorMessage: "missing the required field 'name'"
  }
})
const batch = fixture('batch', {
  mode: 'batch',
  events: [event('a'), event('b')],
  expect: { status: 'success' }
} as Partial<CTFixture>)
const multistatus = fixture('multistatus', {
  mode: 'batchWithMultistatus',
  events: [event('a'), event('b')],
  features: { 'fake-multistatus': true },
  expect: { status: 'success' }
} as Partial<CTFixture>)

// The adapter must send resolved settings and the mapped payload: `name` and `id` come from field defaults.
type Sent = { name?: unknown; id?: unknown }
const mapped = (name: string) => (body: Sent) => body.name === name && typeof body.id === 'string'

describe('InProcessAdapter on a fake destination', () => {
  afterEach(() => nock.cleanAll())

  it('passes success, failure, error and batch fixtures, sending resolved settings and mapped payloads', async () => {
    const api = nock('https://api.fake.test')
      .matchHeader('x-api-key', 'secret')
      .post('/send', mapped('accepted'))
      .reply(200, { ok: true })
      .post('/send', mapped('rejected'))
      .reply(404, { error: 'nope' })
      .post('/batch', (body: Sent[]) => body.map((e) => e.name).join() === 'a,b')
      .reply(200, { results: [] })

    const report = await runSuites(new InProcessAdapter(), [apiSuite([accepted, rejected, invalid, batch])], { env })

    expect(report.results.map((r) => [r.fixture, r.outcome, r.reason])).toEqual([
      ['accepted', 'passed', undefined],
      ['rejected', 'passed', undefined],
      ['invalid', 'passed', undefined],
      ['batch', 'passed', undefined]
    ])
    expect(report.exitCode).toBe(0)
    expect(api.isDone()).toBe(true)
  })

  it('reports the partner exchange when the partner rejects the request', async () => {
    nock('https://api.fake.test').post('/send').reply(401, { error: 'Invalid API key' })
    const suite = apiSuite([accepted])

    const observation = await new InProcessAdapter().run(buildInvocation(suite, accepted, env), suite)

    expect(observation.exchanges).toEqual([
      expect.objectContaining({ method: 'POST', status: 401, body: { error: 'Invalid API key' } })
    ])
  })

  it('returns per-event multistatus when performBatch returns a MultiStatusResponse', async () => {
    nock('https://api.fake.test')
      .post('/batch')
      .reply(200, { results: [{ status: 200 }, { status: 400, message: 'bad' }] })
    const suite = apiSuite([multistatus])

    const observation = await new InProcessAdapter().run(buildInvocation(suite, multistatus, env), suite)

    expect(observation.error).toBeUndefined()
    expect(observation.multistatus?.map((item) => [item.status, item.errormessage])).toEqual([
      [200, undefined],
      [400, 'bad']
    ])
  })

  it('fails batchWithMultistatus when performBatch returned a plain response', async () => {
    nock('https://api.fake.test').post('/batch').reply(200, { results: [] })

    const report = await runSuites(new InProcessAdapter(), [apiSuite([{ ...multistatus, features: {} }])], { env })

    expect(report.results[0].outcome).toBe('failed')
    expect(report.results[0].reason).toBe(
      'performBatch did not return a MultiStatusResponse, so per-event results only copy one response'
    )
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
  const env = { CT_FAKE_REFRESH: 'long-lived' }
  const oauthSuite = (fixtures: CTSuite['fixtures'], extra: Partial<CTSuite> = {}): CTSuite => ({
    destination: 'fake-oauth',
    action: 'send',
    definition,
    config: {
      settings: { region: 'eu', oauth: { access_token: 'stale', refresh_token: { $env: 'CT_FAKE_REFRESH' } } }
    },
    fixtures,
    ...extra
  })
  const send = (description: string, expect: CTSuite['fixtures'][number]['expect']) =>
    ({
      description,
      mode: 'single',
      subscribe: 'type = "track"',
      event: { type: 'track', event: description, messageId: '$guid', timestamp: '$now' },
      mapping: {},
      expect
    } as CTSuite['fixtures'][number])

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

  it('fails every fixture of a suite whose refresh before hooks fails, which quarantine can excuse', async () => {
    nock('https://auth.fake.test').post('/token').times(2).reply(400, { error: 'invalid_grant' })
    let suiteAfterRan = false
    const hooked = oauthSuite([send('a', { status: 'success' }), send('b', { status: 'success' })], {
      before: async () => ({}),
      after: async () => {
        suiteAfterRan = true
      }
    })

    const report = await runSuites(new InProcessAdapter(), [hooked], { env })
    expect(report.exitCode).toBe(1)
    expect(report.setupErrors).toEqual([])
    expect(report.results.map((r) => [r.fixture, r.outcome])).toEqual([
      ['a', 'failed'],
      ['b', 'failed']
    ])
    expect(report.results[0].reason).toMatch(/^OAuth refresh failed before hooks: re-authorize the sandbox app/)
    // No hook ran, so there is nothing for the suite's after to clean up.
    expect(suiteAfterRan).toBe(false)

    const quarantine = [{ destination: 'fake-oauth', expires: '2999-01-01' }]
    const excused = await runSuites(new InProcessAdapter(), [hooked], { env, quarantine })
    expect(excused.exitCode).toBe(0)
    expect(excused.results.map((r) => r.outcome)).toEqual(['quarantined', 'quarantined'])

    // A malformed fixture stays a setup error, not hidden behind the refresh failure.
    nock('https://auth.fake.test').post('/token').reply(400, { error: 'invalid_grant' })
    const broken = {
      ...send('c', { status: 'multistatus', items: [{ status: '2xx' }] })
    } as CTSuite['fixtures'][number]
    const withBroken = await runSuites(new InProcessAdapter(), [{ ...hooked, fixtures: [broken] }], { env, quarantine })
    expect(withBroken.exitCode).toBe(2)
    expect(withBroken.results).toEqual([])
    expect(withBroken.setupErrors).toHaveLength(1)
    expect(withBroken.setupErrors[0]).toMatch(/^fake-oauth\/send › c: /)
  })

  it('shares one refresh before hooks across suites on the same credentials, and reports it', async () => {
    const token = nock('https://auth.fake.test').post('/token').once().reply(200, { access_token: 'fresh' })
    nock('https://api.fake.test').persist().post('/send').reply(200, { ok: true })
    const seen: unknown[] = []
    const hooked = (description: string) =>
      oauthSuite([send(description, { status: 'success' })], {
        before: async ({ settings }) => {
          seen.push((settings.oauth as { access_token: string }).access_token)
          return {}
        }
      })
    const refreshed: string[] = []

    const report = await runSuites(new InProcessAdapter(), [hooked('one'), hooked('two')], {
      env,
      concurrency: 2,
      onTokenRefresh: async (destination, tokens) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        refreshed.push(`${destination}:${tokens.accessToken}`)
      }
    })

    expect(report.exitCode).toBe(0)
    expect(token.isDone()).toBe(true)
    expect(seen).toEqual(['fresh', 'fresh'])
    expect(refreshed).toEqual(['fake-oauth:fresh'])
  })

  it('turns an onTokenRefresh throw into a warning, not a failure', async () => {
    nock('https://auth.fake.test').post('/token').reply(200, { access_token: 'fresh' })
    nock('https://api.fake.test').post('/send').reply(200, { ok: true })

    const report = await runSuites(
      new InProcessAdapter(),
      [oauthSuite([send('a', { status: 'success' })], { before: async () => ({}) })],
      {
        env,
        onTokenRefresh: async () => {
          throw new Error('vault down')
        }
      }
    )

    expect(report.exitCode).toBe(0)
    expect(report.warnings).toEqual(['fake-oauth: onTokenRefresh failed: vault down'])
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
    } as unknown as CTSuite['fixtures'][number]
    const report = await runSuites(
      new InProcessAdapter(),
      [{ ...oauthSuite([fixture]), definition: batchDefinition }],
      { env }
    )

    expect(report.results.map((r) => [r.outcome, r.reason])).toEqual([['passed', undefined]])
  })
})
