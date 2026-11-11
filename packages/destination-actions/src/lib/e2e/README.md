# E2E (component) test framework

Runs a cloud-mode destination's fixtures **live** against a real partner sandbox, no `nock`
mocks. Unit tests prove our code matches our mock; these prove the live partner accepts what the
destination sends.

The runner core is adapter-neutral. Locally, fixtures run in-process through the destination
definition. The integrations pre-deploy harness runs the same fixtures, from this package, through
its own adapter against the integrations service. A fixture written here is the unit of coverage in
both places.

## Layout

```
src/lib/e2e/
  types.ts          # fixtures, expectations, E2ESuite, E2EResult
  helpers.ts        # createE2EEvent + Engage/Journeys/RETL event builders
  resolve.ts        # { $env } settings and $now / $guid markers
  invocation.ts     # buildInvocation: fixture -> adapter-neutral E2EInvocation
  validate.ts       # expectation vs observation, no jest
  run.ts            # runSuites(adapter, suites, opts): scope, preflight, concurrency, retries, quarantine, exit code
  registry.ts       # every onboarded destination's suites
  adapters/
    types.ts        # E2EAdapter, E2EInvocation, E2EObservation, E2ESetupError
    in-process.ts   # InProcessAdapter (local; not exported from index.ts)
  index.ts          # what the integrations harness imports

src/destinations/<dest>/__e2e__/index.ts                # config (settings via { $env }) + suites
src/destinations/<dest>/<action>/__e2e__/*.e2e.ts       # default-export E2EFixture[]
test/e2e/live.e2e.ts                                    # local entry: registry through InProcessAdapter
```

## Onboarding a destination

1. Add `<dest>/<action>/__e2e__/*.e2e.ts`, each `export default` an `E2EFixture[]`.
2. Add `<dest>/__e2e__/index.ts` with its `config` and `export const suites: E2ESuite[]`, one per action.
3. Add one import line to `registry.ts`.

Fixture files import from `lib/e2e/helpers` and `lib/e2e/types`, not the `lib/e2e` index: the
index loads the registry, which loads the fixtures. Fixtures hold no secrets or partner account
IDs, only `{ $env: 'E2E_<DEST>_<KEY>' }` names. A fixture's `description` is its result ID, so
keep it unique within its action.

## Running

```bash
# from the repo root
chamber exec action-destinations-e2e -- yarn cloud e2e

E2E_DESTINATIONS=mixpanel,webhook   # only these destination folders
E2E_CONCURRENCY=4                   # suites in parallel
E2E_REPORT=/tmp/e2e.json            # also write the JSON report
```

Without chamber access, export the same `E2E_*` variables. A suite whose variables are missing
is a setup error (report `exitCode` 2), never a silent skip. Webhook needs none. Locally `yarn e2e`
fails on any non-zero `exitCode`; the summary and `E2E_REPORT` say which. `yarn cloud test` never runs
these: the live entry has its own jest config, `jest.e2e.config.js`, without the nock setup that
blocks network access.

## Writing an adapter

Implement `E2EAdapter` and call `runSuites(adapter, suites, opts)`. The core hands the adapter an
`E2EInvocation`: settings with secrets resolved, the events with markers resolved, the
`subscribe` FQL, and the mapping with the action's field defaults overlaid by the fixture's, as a
stored subscription carries it. The adapter sends it and returns an `E2EObservation`:

- `exchanges`: the partner request/response pairs (`url`, `method`, response `status` and `body`).
- `error`: what our code threw, as the Segment error code integrations reports (for example
  `PAYLOAD_VALIDATION_FAILED`) and its status.
- `multistatus`: the per-event results of a batch.

Throw `E2ESetupError` when the target itself is unusable. `InProcessAdapter` calls
`destination.onEvent` / `onBatch` with the subscription in settings, the same entry points
integrations uses, and maps errors the way integrations does.

## Expectation shapes

- `success`: a request was sent and the partner returned 2xx, and every batch item is 2xx.
  Optional `httpStatus`, `bodyContains`, `jsonContains` (partial deep match) on the last response.
- `failure`: the partner returned non-2xx (proves we reject known-bad input). `httpStatus`
  required; optional `bodyContains` / `jsonContains`.
- `error`: our code threw before any request left. `errorType` is the Segment error code;
  optional `httpStatus` and `errorMessage`.

## Dynamic markers

`$now` (ISO timestamp), `$guid` (fresh UUID), `$guid:<name>` (UUID stable within one fixture
attempt), resolved in events and mappings.

## Not yet supported

Audience fixtures (`E2EAudienceDestinationConfig`: createAudience, getAudience, teardown) have
types but no runner support.
