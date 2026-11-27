/**
 * Local component test run: every registered suite through the InProcessAdapter, against live partner sandboxes.
 *
 *   CT_MIXPANEL_PROJECT_TOKEN=... yarn cloud component-test
 *
 * CT_DESTINATIONS=mixpanel,webhook   only these destination folders
 * CT_CONCURRENCY=4                   suites in parallel
 * CT_REPORT=/tmp/component-test.json also write the JSON report
 */
import { writeFileSync } from 'node:fs'
import { InProcessAdapter, formatSummary, runSuites, suites } from '../../src/lib/component-test'

const list = (value?: string) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

test(
  'Component test suites',
  async () => {
    const report = await runSuites(new InProcessAdapter(), suites, {
      destinations: list(process.env.CT_DESTINATIONS),
      concurrency: process.env.CT_CONCURRENCY ? Number(process.env.CT_CONCURRENCY) : undefined,
      onTokenRefresh: (destination, tokens) => {
        // eslint-disable-next-line no-console
        console.log(`${destination}: OAuth tokens refreshed`)
        // A local run can't save a refresh token; the runner makes a rotated one a setup error.
        if (tokens.refreshToken) throw new Error('a refresh token came back; update the stored secret if it changed')
      }
    })
    if (process.env.CT_REPORT) writeFileSync(process.env.CT_REPORT, JSON.stringify(report, null, 2))
    // eslint-disable-next-line no-console
    console.log(formatSummary(report))
    expect(report.exitCode).toBe(0)
  },
  10 * 60 * 1000
)
