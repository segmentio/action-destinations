/**
 * Local E2E run: every registered suite through the InProcessAdapter, against live partner sandboxes.
 *
 *   E2E_MIXPANEL_PROJECT_TOKEN=... E2E_MIXPANEL_API_SECRET=... yarn cloud e2e
 *
 * E2E_DESTINATIONS=mixpanel,webhook   only these destination folders
 * E2E_CONCURRENCY=4                   suites in parallel
 * E2E_REPORT=/tmp/e2e.json            also write the JSON report
 */
import { writeFileSync } from 'node:fs'
import { InProcessAdapter, formatSummary, runSuites, suites } from '../../src/lib/e2e'

const list = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

test(
  'E2E suites',
  async () => {
    const report = await runSuites(new InProcessAdapter(), suites, {
      destinations: list(process.env.E2E_DESTINATIONS),
      concurrency: process.env.E2E_CONCURRENCY ? Number(process.env.E2E_CONCURRENCY) : undefined,
      onTokenRefresh: (destination, tokens) => {
        const rotated = tokens.refreshToken ? '; a new refresh token came back, update the stored secret' : ''
        // eslint-disable-next-line no-console
        console.log(`${destination}: OAuth tokens refreshed${rotated}`)
      }
    })
    if (process.env.E2E_REPORT) writeFileSync(process.env.E2E_REPORT, JSON.stringify(report, null, 2))
    // eslint-disable-next-line no-console
    console.log(formatSummary(report))
    expect(report.exitCode).toBe(0)
  },
  10 * 60 * 1000
)
