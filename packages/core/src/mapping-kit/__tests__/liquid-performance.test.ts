import { transformBatch } from '../index'
import { createLiquidEngine } from '../liquid-directive'

/**
 * Benchmarks how @liquid cost scales with templates per mapping and events per batch.
 *
 * Skipped by default because timings vary by machine. Run with:
 *   LIQUID_BENCH=1 yarn jest src/mapping-kit/__tests__/liquid-performance.test.ts
 * LIQUID_BENCH_EVENTS sets the batch size (default 20000).
 *
 * Results are logged, not asserted.
 */

const runBench = process.env.LIQUID_BENCH === '1'
const describeBench = runBench ? describe : describe.skip
const EVENTS = Number(process.env.LIQUID_BENCH_EVENTS ?? 20000)
const RUNS = 3

// Same config production uses
const engine = createLiquidEngine()

function mkEvent(i: number, big = 'x') {
  return {
    type: 'track',
    event: 'Audience Entered',
    userId: `user-${i}`,
    properties: { audience_key: 'vip_users', score: i % 100, plan: i % 2 ? 'pro' : 'free' },
    traits: { email: `User.${i}@Example.com`, first_name: 'Ada', last_name: 'Lovelace', big },
    context: { personas: { computation_key: 'vip_users' } }
  }
}

// Fills as close to the 1000-character limit as whole blocks allow
function heavyTemplate(): string {
  let tpl = ''
  for (let k = 0; ; k++) {
    const block = `{% assign v${k} = traits.email | downcase | strip | replace: "@", "_" %}{% if properties.score > ${k} %}{{ v${k} | truncate: 20 }}{% endif %}`
    if (tpl.length + block.length > 1000) return tpl
    tpl += block
  }
}

const TEMPLATES: Record<string, string> = {
  simple: '{{ traits.email | downcase }}',
  medium:
    '{% if properties.plan == "pro" %}{{ traits.first_name | capitalize }} {{ traits.last_name | upcase }}{% else %}{{ traits.email | split: "@" | first }}{% endif %}',
  heavy: heavyTemplate()
}

// Render cost driven by event field size rather than template length
const BIG_FIELD_TEMPLATE = '{{ traits.big | split: "," | join: "-" | size }}'

/** Median per-event µs over RUNS runs, after a warmup pass over the same inputs */
function timeIt(events: unknown[], fn: (e: unknown) => unknown): number {
  for (const e of events.slice(0, Math.min(2000, events.length))) fn(e)
  const samples: number[] = []
  for (let r = 0; r < RUNS; r++) {
    const start = process.hrtime.bigint()
    for (const e of events) fn(e)
    samples.push(Number(process.hrtime.bigint() - start) / 1e3 / events.length)
  }
  return samples.sort((a, b) => a - b)[Math.floor(RUNS / 2)]
}

function csv(bytes: number): string {
  const items: string[] = []
  let len = 0
  for (let i = 0; len < bytes; i++) {
    items.push(`item${i}`)
    len += `item${i}`.length + 1
  }
  return items.join(',')
}

describeBench('@liquid performance', () => {
  jest.setTimeout(10 * 60 * 1000)
  const events = Array.from({ length: EVENTS }, (_, i) => mkEvent(i))

  test('parse vs render per template', () => {
    const rows = Object.entries(TEMPLATES).map(([name, tpl]) => {
      const parsed = engine.parse(tpl)
      return {
        template: name,
        length: tpl.length,
        'parse+render µs': timeIt(events, (e) => engine.parseAndRenderSync(tpl, e)).toFixed(1),
        'parse µs': timeIt(events, () => engine.parse(tpl)).toFixed(1),
        'render µs (cached parse)': timeIt(events, (e) => engine.renderSync(parsed, e)).toFixed(1)
      }
    })
    console.table(rows)
  })

  test('render cost vs event field size', () => {
    const parsed = engine.parse(BIG_FIELD_TEMPLATE)
    const rows = [1_000, 10_000, 50_000].map((bytes) => {
      const big = csv(bytes)
      const sized = events.map((_, i) => mkEvent(i, big))
      return {
        'field bytes': big.length,
        'parse+render µs': timeIt(sized, (e) => engine.parseAndRenderSync(BIG_FIELD_TEMPLATE, e)).toFixed(1),
        'render µs (cached parse)': timeIt(sized, (e) => engine.renderSync(parsed, e)).toFixed(1)
      }
    })
    console.table(rows)
  })

  test('transformBatch with N @liquid fields per mapping', () => {
    const rows: Record<string, string | number>[] = []
    for (const [name, tpl] of Object.entries(TEMPLATES)) {
      for (const n of [5, 20]) {
        const mapping: Record<string, unknown> = {}
        for (let f = 0; f < n; f++) mapping[`field_${f}`] = { '@liquid': tpl }

        const start = process.hrtime.bigint()
        transformBatch(mapping, events)
        const ms = Number(process.hrtime.bigint() - start) / 1e6

        rows.push({ template: name, 'liquid fields': n, events: EVENTS, 'batch ms': ms.toFixed(0) })
      }
    }
    console.table(rows)
  })
})
