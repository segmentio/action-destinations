// The Braze component test suites through InProcessAdapter, with Braze's REST API mocked by nock.
import nock from 'nock'
import { InProcessAdapter } from '../../../lib/component-test/adapters/in-process'
import { buildInvocation } from '../../../lib/component-test/invocation'
import { runSuites } from '../../../lib/component-test/run'
import { suites as brazeSuites } from '../__component-test__'

describe('InProcessAdapter on the Braze suites', () => {
  const brazeEnv = { CT_BRAZE_API_KEY: 'test-key', CT_BRAZE_ENDPOINT: 'https://rest.iad-01.braze.com' }
  // Answers as Braze's REST API does: 401 for an unknown key, else 201 with a count per array sent.
  type BrazeBody = Record<string, unknown[] | undefined>
  function reply(this: { req: { headers: Record<string, string | string[]> } }, _uri: string, body: BrazeBody) {
    if (String(this.req.headers.authorization) !== 'Bearer test-key') return [401, { message: 'Invalid API key' }]
    const count = (key: string) => (body[key] ? { [`${key}_processed`]: body[key]?.length } : {})
    return [201, { message: 'success', ...count('events'), ...count('purchases'), ...count('attributes') }]
  }

  afterEach(() => nock.cleanAll())

  it('passes every fixture', async () => {
    nock('https://rest.iad-01.braze.com')
      .persist()
      .post('/users/track')
      .reply(reply as never)
      .post('/users/alias/new')
      .reply(201, (_uri, body) => ({
        message: 'success',
        aliases_processed: (body as BrazeBody).user_aliases?.length
      }))

    const report = await runSuites(new InProcessAdapter(), brazeSuites, { env: brazeEnv })

    const failures = report.results.filter((r) => r.outcome !== 'passed').map((r) => [r.suite, r.fixture, r.reason])
    expect(failures).toEqual([])
    expect(report.results).toHaveLength(brazeSuites.reduce((n, suite) => n + suite.fixtures.length, 0))
    expect(report.exitCode).toBe(0)
  })

  it('records that Braze performBatch returned a MultiStatusResponse', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(201, { message: 'success', events_processed: 3 })
    const suite = brazeSuites[0]
    const fixture = suite.fixtures.find((f) => f.mode === 'batchWithMultistatus' && f.expect.status === 'success')
    if (!fixture) throw new Error('the Braze trackEvent2 suite has no batchWithMultistatus success fixture')

    const observation = await new InProcessAdapter().run(buildInvocation(suite, fixture, brazeEnv), suite)
    expect(observation.returnedMultiStatus).toBe(true)
    // The wrap is on a copy: the shared definition keeps its own performBatch.
    expect(suite.definition.actions.trackEvent2.performBatch?.name).toBe('performBatch')
  })
})
