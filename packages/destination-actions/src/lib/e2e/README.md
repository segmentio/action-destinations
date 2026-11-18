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
  resolve.ts        # { $env } settings and $now / $guid / $before markers
  invocation.ts     # buildInvocation: fixture -> adapter-neutral E2EInvocation
  hooks.ts          # the context before / after hooks get
  validate.ts       # expectation vs observation, no jest
  run.ts            # runSuites(adapter, suites, opts): scope, preflight, concurrency, retries, quarantine, exit code
  registry.ts       # every onboarded destination's suites
  adapters/
    types.ts        # E2EAdapter, E2EInvocation, E2EObservation, E2ESetupError
    in-process.ts   # InProcessAdapter (local runs and the integrations gate's first pass)
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
index loads the registry, which loads the fixtures. Fixtures hold no secrets, only
`{ $env: 'E2E_<DEST>_<KEY>' }` names. Partner resource IDs (catalog, audience) aren't secrets and
live as constants in `<dest>/__e2e__/index.ts`. Event builders set `timestamp` and `receivedAt` to `$now`. A fixture's `description` is its result ID, so
keep it unique within its action.

## Running

```bash
# from the repo root, with the destination's E2E_* variables exported
yarn cloud e2e

E2E_DESTINATIONS=mixpanel,webhook   # only these destination folders
E2E_CONCURRENCY=4                   # suites in parallel
E2E_REPORT=/tmp/e2e.json            # also write the JSON report
```

Once the `action-destinations-e2e` chamber service exists, `chamber exec action-destinations-e2e -- yarn cloud e2e`
supplies them instead. A suite whose variables are missing
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
- `returnedMultiStatus`: whether the action's `performBatch` returned a `MultiStatusResponse`. Core
  turns any other return into per-event results that copy one status. Leave it unset when the
  adapter can't see it.
- `refreshedTokens`: the tokens core passed to `onTokenRefresh` after a 401. The runner writes them
  over `settings.oauth` for the rest of the run (see OAuth below). Leave it unset when the
  target keeps tokens itself, as integrations' token store does.
- `refreshFailed`: the destination's `refreshAccessToken` threw or returned nothing. Core reports a
  throw as the token request's own error, so the report needs this to name the cause.

Throw `E2ESetupError` when the target itself is unusable. `InProcessAdapter` calls
`destination.onEvent` / `onBatch` with the subscription in settings, the same entry points
integrations uses, and maps errors the way integrations does.

## Expectation shapes

- `success`: a request was sent and the partner returned 2xx, and every batch item is 2xx.
  Optional `httpStatus` and the response checks below. A suite's `defaultSuccess` is merged into
  each of its `success` expectations; the fixture's own keys win.
- `failure`: the partner returned non-2xx (proves we reject known-bad input). `httpStatus`
  required; optional response checks.
- `error`: our code rejected the event before any request left: it threw, or in batch modes every
  multistatus item carries the error. `errorType` is the Segment error code; optional `httpStatus` and
  `errorMessage`.
- `multistatus`: a batch's per-event results, one `items` entry per event in order. `status` is exact
  or `'2xx'`; a rejected item also needs `errortype` (exact) and `errormessage` (substring), and may
  set `errorreporter`. Use with `batchWithMultistatus`.

Response checks, on `success` and `failure`:

- `exchange: { method?, url? }` picks the last exchange with that method and a URL containing
  `url`; without it, the last exchange is judged. `exchangeCount` asserts how many requests the
  action sent: an OAuth 401 and its retry are 2. The token request itself is not an exchange.
- `bodyContains` (substring), `bodyEquals` (whole body, trimmed; a JSON body is
  compared as compact `JSON.stringify` output, so paste it on one line), `jsonContains` (partial deep
  match, where `'$absent'` requires a key to be missing).

A multistatus expectation needs `batchWithMultistatus` and one item per event; anything else is a
setup error. Batch modes need one result per event. `batchWithMultistatus` fails when `performBatch` returned
anything but a `MultiStatusResponse`, for example when a destination's multistatus flag is off.

## Dynamic markers

`$now` (ISO timestamp), `$guid` (fresh UUID), `$guid:<name>` (UUID stable within one fixture
attempt) and `$before:<key>` (a value a `before` hook returned), resolved in events and mappings.

## Hooks

Suites and fixtures can set `before` and `after` to create and delete quick partner resources.
Slow or async resources are created in the sandbox by hand and kept as constants in
`<dest>/__e2e__/index.ts`.

```
suite.before(ctx)                                   → S
  each fixture:
    fixture.before({ ...ctx, values: S })           → F, merged over S as V
    attempts, with '$before:<key>' → V[key]
    fixture.after({ ...ctx, values: V, observation })
suite.after({ ...ctx, values: S, fixtures })        // always
```

`ctx` holds the resolved `settings`, `request` (the destination's own client, built from its
`extendRequest`; it doesn't refresh on a 401, but see OAuth below) and `runId`. Put `runId` in resource names so
parallel runs don't collide, and name anything `after` deletes in `before`, not with `$guid`, which
changes on each retry. `before` runs once per fixture, not per attempt; a throw, or a
`$before:` key no hook returned, is a setup error and the suite or fixture doesn't run. `after`
always runs, and a throw is a report warning. `fixtures[].cleaned` tells the suite's `after` which
fixtures' own `after` succeeded.

## OAuth

Point the suite's settings at chamber under `settings.oauth` (`access_token`, `refresh_token`,
`clientId`, `clientSecret`), the keys core reads. The first 401 makes core refresh and retry; the
runner keeps the new tokens for the rest of the run, shared by every suite of that destination with
the same stored refresh token. A suite with hooks refreshes once before its first hook, since hooks
call the partner before any fixture could; suites on the same credentials share that one refresh.
A failed refresh fails the fixture, or every fixture of a suite whose pre-hook refresh failed (exit 1,
so a quarantine entry can excuse it). For a success or multistatus expectation, the reason
includes "OAuth refresh failed".

That refresh happens on every run, even when the stored access token is still valid, so a partner
that rotates refresh tokens rotates it each run with hooks.

`onTokenRefresh(destination, tokens)` in the run options gets each refresh; it is awaited. A throw is a setup
error when the refresh returned a new refresh token, which is then lost, and a warning otherwise. A partner that rotates refresh tokens invalidates the stored one, so a
harness for one must save `tokens.refreshToken`, and run it alone (`destinations: [name]`) with
`concurrency: 1`: two fixtures that hit a 401 at once each refresh with the same token. The local
run only logs that a refresh happened.
