#!/usr/bin/env npx ts-node
/**
 * Klaviyo API Upgrade Validation Script
 *
 * Makes real HTTP calls against both the stable and canary API revisions,
 * structurally diffs the responses, and writes a validation-report.md.
 *
 * Usage:
 *   KLAVIYO_TEST_API_KEY=xxx \
 *   KLAVIYO_TEST_LIST_ID=R8kpbJ \
 *   npx ts-node packages/destination-actions/src/destinations/klaviyo/__validation__/validate.ts
 *
 * When chamber is available:
 *   chamber exec klaviyo-test -- npx ts-node .../validate.ts
 *
 * Required env vars:
 *   KLAVIYO_TEST_API_KEY   - Klaviyo private API key
 *
 * Optional env vars:
 *   KLAVIYO_TEST_LIST_ID   - List ID for fixtures requiring a list (default: R8kpbJ)
 *   KLAVIYO_STABLE_REVISION  - Stable revision date (default: 2025-01-15)
 *   KLAVIYO_CANARY_REVISION  - Canary revision date (default: 2026-01-15)
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { URL } from 'url'

import { buildFixtures, Fixture } from './fixtures'
import { normalizeResponse } from './normalizer'
import { diffResponses, formatDiff } from './differ'

// ---------------------------------------------------------------------------
// Config from env
// ---------------------------------------------------------------------------

const LIST_ID = process.env.KLAVIYO_TEST_LIST_ID ?? 'R8kpbJ'
const STABLE_REVISION = process.env.KLAVIYO_STABLE_REVISION ?? '2025-01-15'
const CANARY_REVISION = process.env.KLAVIYO_CANARY_REVISION ?? '2026-01-15'
const API_BASE = 'https://a.klaviyo.com/api'

// ---------------------------------------------------------------------------
// HTTP client (no extra dependencies — uses built-in https)
// ---------------------------------------------------------------------------

interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: unknown
}

function request(method: string, url: string, revision: string, body?: unknown): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined
    const parsed = new URL(url)

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_TEST_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        revision
      }
    }

    if (payload && options.headers) {
      options.headers['Content-Length'] = Buffer.byteLength(payload).toString()
    }

    const req = https.request(options, (res) => {
      let raw = ''
      res.on('data', (chunk) => (raw += chunk))
      res.on('end', () => {
        let parsed: unknown = raw
        try {
          parsed = JSON.parse(raw)
        } catch {
          // leave as string
        }
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers as Record<string, string>,
          body: parsed
        })
      })
    })

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ---------------------------------------------------------------------------
// Run a single fixture against both revisions
// ---------------------------------------------------------------------------

interface FixtureResult {
  fixture: Fixture
  stable: HttpResponse
  canary: HttpResponse
  reportSection: string
}

async function runFixture(fixture: Fixture): Promise<FixtureResult> {
  const url = `${API_BASE}${fixture.path}`
  process.stdout.write(`  Running ${fixture.id}... `)

  // Resolve body — fixtures may provide a function so each revision gets
  // distinct identifiers, avoiding 409 conflicts on sequential write calls
  const resolveBody = (b: unknown) => (typeof b === 'function' ? (b as (r: string) => unknown)(STABLE_REVISION) : b)
  const resolveCanaryBody = (b: unknown) =>
    typeof b === 'function' ? (b as (r: string) => unknown)(CANARY_REVISION) : b

  // Run sequentially — parallel calls to write endpoints cause race conditions
  const stable = await request(fixture.method, url, STABLE_REVISION, resolveBody(fixture.body))
  await new Promise((r) => setTimeout(r, 200))
  const canary = await request(fixture.method, url, CANARY_REVISION, resolveCanaryBody(fixture.body))

  const normalizedStable = normalizeResponse(stable.status, stable.body, stable.headers)
  const normalizedCanary = normalizeResponse(canary.status, canary.body, canary.headers)

  const result = diffResponses(
    normalizedStable.status,
    normalizedStable.body,
    normalizedCanary.status,
    normalizedCanary.body
  )

  const icon = result.hasDiff ? '⚠️' : '✅'
  console.log(icon)

  const reportSection = [
    `## ${fixture.id}`,
    `_${fixture.description}_`,
    ``,
    `- Stable (${STABLE_REVISION}): **HTTP ${stable.status}**`,
    `- Canary (${CANARY_REVISION}): **HTTP ${canary.status}**`,
    ``,
    formatDiff(result, stable.status, canary.status)
  ].join('\n')

  return { fixture, stable, canary, reportSection }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const API_KEY = process.env.KLAVIYO_TEST_API_KEY
  if (!API_KEY) {
    console.error('❌  KLAVIYO_TEST_API_KEY is required')
    process.exit(1)
  }

  console.log(`\nKlaviyo API Validation: ${STABLE_REVISION} → ${CANARY_REVISION}`)
  console.log(`${'─'.repeat(60)}\n`)

  const fixtures = buildFixtures(LIST_ID)
  const results: FixtureResult[] = []

  for (const fixture of fixtures) {
    try {
      results.push(await runFixture(fixture))
    } catch (err) {
      console.log('❌  ERROR')
      results.push({
        fixture,
        stable: { status: 0, headers: {}, body: null },
        canary: { status: 0, headers: {}, body: null },
        reportSection: `## ${fixture.id}\n\n❌ Error: ${(err as Error).message}`
      })
    }
    // Brief pause to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300))
  }

  const diffs = results.filter((r) => {
    const norm = normalizeResponse(r.stable.status, r.stable.body, r.stable.headers)
    const normC = normalizeResponse(r.canary.status, r.canary.body, r.canary.headers)
    return diffResponses(norm.status, norm.body, normC.status, normC.body).hasDiff
  })

  // -------------------------------------------------------------------------
  // Write report
  // -------------------------------------------------------------------------
  const report = [
    `# Klaviyo API Validation Report`,
    ``,
    `**Stable revision**: \`${STABLE_REVISION}\``,
    `**Canary revision**: \`${CANARY_REVISION}\``,
    `**Generated**: ${new Date().toISOString()}`,
    `**Fixtures run**: ${results.length}`,
    `**Differences found**: ${diffs.length}`,
    ``,
    diffs.length === 0
      ? `> ✅ All ${results.length} endpoints are structurally identical across both revisions. Safe to promote canary.`
      : `> ⚠️  ${diffs.length} endpoint(s) have structural differences. Review before promoting canary.`,
    ``,
    `---`,
    ``,
    ...results.map((r) => r.reportSection),
    ``,
    `---`,
    ``,
    `_This file is generated by the api-version-upgrade validation script._`,
    `_Delete this file when the canary revision is promoted to stable._`
  ].join('\n')

  const reportPath = path.join(__dirname, 'validation-report.md')
  fs.writeFileSync(reportPath, report, 'utf8')

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Fixtures: ${results.length} run, ${diffs.length} with differences`)
  console.log(`Report written to: ${reportPath}`)

  if (diffs.length > 0) {
    console.log(`\n⚠️  Differences detected in:`)
    diffs.forEach((r) => console.log(`   - ${r.fixture.id}`))
    process.exit(1)
  } else {
    console.log(`\n✅ All clear — no structural differences between revisions`)
    process.exit(0)
  }
}

// Only run when executed directly (not when imported by type generators or tests)
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
