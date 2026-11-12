// The InProcessAdapter end to end on the registered suites, with the partners mocked by nock.
import nock from 'nock'
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
      .reply(200, { code: 200, status: 'OK', num_records_imported: 2 })

    const [suite] = suites
    const fixture = suite.fixtures.find((f) => f.mode === 'batchWithMultistatus')
    if (!fixture) throw new Error('the Mixpanel suite has no batchWithMultistatus fixture')
    const observation = await new InProcessAdapter().run(buildInvocation(suite, fixture, env), suite)

    expect(observation.error).toBeUndefined()
    expect(observation.multistatus?.map((item) => item.status)).toEqual([200, 200])
  })
})
