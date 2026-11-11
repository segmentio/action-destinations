// Contract test: runs the core through a fake adapter, so it fails if the core starts depending on
// anything an adapter (in-process here, or integrations' own) does not provide through E2EAdapter.
import type { DestinationDefinition } from '@segment/actions-core'
import { E2ESetupError } from '../adapters/types'
import type { E2EAdapter, E2EInvocation, E2EObservation } from '../adapters/types'
import { formatSummary, runSuites } from '../run'
import type { E2EFixture, E2ESuite } from '../types'

const definition: DestinationDefinition<Record<string, unknown>> = {
  name: 'Fake',
  slug: 'actions-fake',
  mode: 'cloud',
  actions: {
    send: {
      title: 'Send',
      description: 'Send',
      fields: {
        name: { label: 'Name', description: 'Name', type: 'string', default: { '@path': '$.event' } },
        id: { label: 'Id', description: 'Id', type: 'string', default: { '@path': '$.messageId' } }
      },
      perform: () => undefined
    }
  }
}

const ok = { exchanges: [{ method: 'POST', url: 'https://fake.test/send', status: 200, body: { ok: true } }] }

const fixture = (description: string, overrides: Partial<E2EFixture> = {}): E2EFixture =>
  ({
    description,
    mode: 'single',
    subscribe: 'type = "track"',
    event: { type: 'track', event: description, messageId: '$guid:id', timestamp: '$now' },
    mapping: { extra: '$guid:id' },
    expect: { status: 'success' },
    ...overrides
  } as E2EFixture)

const suite = (destination: string, fixtures: E2EFixture[]): E2ESuite => ({
  destination,
  action: 'send',
  definition,
  config: { settings: { apiKey: { $env: 'E2E_FAKE_KEY' }, region: 'us' } },
  fixtures
})

class FakeAdapter implements E2EAdapter {
  readonly name = 'fake'
  calls: E2EInvocation[] = []
  constructor(private reply: (invocation: E2EInvocation, call: number) => E2EObservation | Promise<E2EObservation>) {}
  async run(invocation: E2EInvocation) {
    this.calls.push(invocation)
    return this.reply(invocation, this.calls.length)
  }
}

const env = { E2E_FAKE_KEY: 'secret' }
const opts = { env, backoffMs: 0 }

describe('runSuites', () => {
  it('passes fixtures whose observations match, and exits 0', async () => {
    const adapter = new FakeAdapter(() => ok)
    const report = await runSuites(adapter, [suite('fake', [fixture('a'), fixture('b')])], opts)

    expect(report.exitCode).toBe(0)
    expect(report.adapter).toBe('fake')
    expect(report.results.map((r) => [r.fixture, r.outcome, r.attempts])).toEqual([
      ['a', 'passed', 1],
      ['b', 'passed', 1]
    ])
  })

  it('hands the adapter a resolved, adapter-neutral invocation', async () => {
    const adapter = new FakeAdapter(() => ok)
    await runSuites(adapter, [suite('fake', [fixture('a', { features: { flag: true } })])], opts)
    const [invocation] = adapter.calls

    expect(invocation).toMatchObject({
      slug: 'actions-fake',
      action: 'send',
      mode: 'single',
      subscribe: 'type = "track"',
      settings: { apiKey: 'secret', region: 'us' },
      features: { flag: true },
      mapping: { name: { '@path': '$.event' }, id: { '@path': '$.messageId' } }
    })
    // '$guid:id' resolves to one value across the event and the mapping; '$now' to a timestamp.
    expect(invocation.events[0].messageId).toMatch(/^[0-9a-f-]{36}$/)
    expect(invocation.mapping.extra).toBe(invocation.events[0].messageId)
    expect(Number.isNaN(Date.parse(invocation.events[0].timestamp as string))).toBe(false)
  })

  it('fails a fixture whose observation does not match, and exits 1', async () => {
    const adapter = new FakeAdapter(() => ({ exchanges: [{ method: 'POST', url: 'x', status: 500, body: 'boom' }] }))
    const report = await runSuites(adapter, [suite('fake', [fixture('a')])], opts)

    expect(report.exitCode).toBe(1)
    expect(report.results[0]).toMatchObject({ outcome: 'failed', reason: 'expected partner status 2xx, got 500' })
  })

  it('retries a failing fixture and passes once it succeeds', async () => {
    const adapter = new FakeAdapter((_, call) => (call < 3 ? { exchanges: [] } : ok))
    const report = await runSuites(adapter, [suite('fake', [fixture('a', { retries: 2 })])], opts)

    expect(report.results[0]).toMatchObject({ outcome: 'passed', attempts: 3 })
    expect(report.exitCode).toBe(0)
  })

  it('counts an adapter throw as a fixture failure', async () => {
    const adapter = new FakeAdapter(() => {
      throw new Error('socket hang up')
    })
    const report = await runSuites(adapter, [suite('fake', [fixture('a')])], opts)

    expect(report.results[0]).toMatchObject({ outcome: 'failed', reason: 'adapter threw: socket hang up' })
    expect(report.exitCode).toBe(1)
  })

  it('excuses quarantined failures until the entry expires', async () => {
    const adapter = new FakeAdapter(() => ({ exchanges: [] }))
    const suites = [suite('fake', [fixture('a'), fixture('b')])]
    const now = new Date('2026-11-06T00:00:00Z')
    const quarantine = [
      { destination: 'fake', fixture: 'a', expires: '2026-12-01' },
      { destination: 'fake', fixture: 'b', expires: '2026-11-01' }
    ]
    const report = await runSuites(adapter, suites, { ...opts, now, quarantine })

    expect(report.results.map((r) => r.outcome)).toEqual(['quarantined', 'failed'])
    expect(report.exitCode).toBe(1)
  })

  it('excuses only what a quarantine entry names', async () => {
    const adapter = new FakeAdapter(() => ({ exchanges: [] }))
    const now = new Date('2026-11-06T00:00:00Z')
    const run = (entry: Record<string, string>) =>
      runSuites(adapter, [suite('fake', [fixture('a'), fixture('b')])], {
        ...opts,
        now,
        quarantine: [{ destination: 'fake', expires: '2026-12-01', ...entry }]
      }).then((report) => report.results.map((r) => r.outcome))

    expect(await run({})).toEqual(['quarantined', 'quarantined'])
    expect(await run({ action: 'send' })).toEqual(['quarantined', 'quarantined'])
    expect(await run({ action: 'other' })).toEqual(['failed', 'failed'])
    expect(await run({ fixture: 'a' })).toEqual(['quarantined', 'failed'])
    expect(await run({ destination: 'other' })).toEqual(['failed', 'failed'])
  })

  it('treats a missing secret as a setup error and does not run that suite', async () => {
    const adapter = new FakeAdapter(() => ok)
    const report = await runSuites(adapter, [suite('fake', [fixture('a')])], { ...opts, env: {} })

    expect(report.exitCode).toBe(2)
    expect(report.setupErrors).toEqual(['fake/send: missing environment variables E2E_FAKE_KEY'])
    expect(adapter.calls).toHaveLength(0)
  })

  it('treats an invalid concurrency or a run with no fixtures as a setup error', async () => {
    const adapter = new FakeAdapter(() => ok)
    const invalid = await runSuites(adapter, [suite('fake', [fixture('a')])], { ...opts, concurrency: NaN })
    const empty = await runSuites(adapter, [suite('fake', [])], opts)

    expect(invalid.exitCode).toBe(2)
    expect(invalid.setupErrors).toEqual(['concurrency must be a positive integer, got NaN'])
    expect(empty.exitCode).toBe(2)
    expect(empty.setupErrors).toEqual(['no fixtures ran'])
    expect(adapter.calls).toHaveLength(0)
  })

  it('treats an unknown destination or an empty selection as a setup error', async () => {
    const adapter = new FakeAdapter(() => ok)
    const report = await runSuites(adapter, [suite('fake', [fixture('a')])], { ...opts, destinations: ['nope'] })

    expect(report.exitCode).toBe(2)
    expect(report.setupErrors).toEqual(['no suites registered for destination "nope"', 'no suites to run'])
  })

  it('stops a suite on E2ESetupError from the adapter and exits 2', async () => {
    const adapter = new FakeAdapter(() => {
      throw new E2ESetupError('integrations is unreachable at http://localhost:3000')
    })
    const report = await runSuites(adapter, [suite('fake', [fixture('a'), fixture('b')])], opts)

    expect(report.exitCode).toBe(2)
    expect(adapter.calls).toHaveLength(1)
    expect(report.setupErrors).toEqual(['fake/send: integrations is unreachable at http://localhost:3000'])
  })

  it('scopes by destination', async () => {
    const suites = ['one', 'two', 'three'].map((name) => suite(name, [fixture(name)]))
    const scoped = await runSuites(new FakeAdapter(() => ok), suites, { ...opts, destinations: ['two'] })

    expect(scoped.results.map((r) => r.suite)).toEqual(['two/send'])
  })

  it('summarizes the report', async () => {
    const report = await runSuites(new FakeAdapter(() => ok), [suite('fake', [fixture('a')])], opts)

    expect(formatSummary(report)).toMatch(/^PASS {2}fake\/send › a \(1 attempt\(s\), \d+ms\)\n1 passed, 0 failed/)
  })
})
