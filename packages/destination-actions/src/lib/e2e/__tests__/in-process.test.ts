// The InProcessAdapter end to end on the registered suites, with the partners mocked by nock.
import nock from 'nock'
import { InProcessAdapter } from '../adapters/in-process'
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

describe('InProcessAdapter on the Mixpanel suite', () => {
  it('passes every fixture when Mixpanel accepts the events', async () => {
    nock('https://api.mixpanel.com')
      .post('/import?strict=1')
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
  })
})
