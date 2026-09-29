# Local E2E (component) test framework

A small, self-contained framework for running **live** end-to-end tests of a cloud-mode
destination against a **real partner API** — no `nock` mocks. It drives the CLI `serve`
server over HTTP, so any developer can run the same fixtures locally.

It complements unit tests: unit tests prove our code matches our mock; these prove the
**live partner accepts what the destination sends**. The same fixtures and the exported
`frame` / `validate` functions are designed to be reused by the deploy-time gating harness
that lives in the integrations service (see the RFC), so a fixture written here is the unit
of coverage both locally and at CD.

Nothing here lives in `packages/core` (core bans `http`/`crypto`/`process`); the fixture
types and event builders are ported from PR #3829 and kept alongside the runner.

## Layout

```
src/lib/e2e/                         # the framework (import from '../../lib/e2e')
  types.ts        # E2EFixture + expectation types (single | batch | batchWithMultistatus)
  helpers.ts      # createE2EEvent + Engage/Journeys/RETL event builders
  e2e-runner.ts   # runE2EFixtures (jest) + pure frame/validate/resolve* functions
  index.ts        # barrel

src/destinations/<dest>/__e2e__/index.ts             # config: settings via { $env: 'NAME' }
src/destinations/<dest>/<action>/__e2e__/fixtures.e2e.ts   # default-export E2EFixture[]
src/destinations/<dest>/__test__/e2e.test.ts         # guarded entrypoint (RUN_E2E)
```

## Running

```bash
# 1. Start the serve server (use the destination FOLDER name; binds 127.0.0.1:3000)
./bin/run serve --destination mixpanel --noUI

# 2. Run the fixtures (from packages/destination-actions)
RUN_E2E=1 BASE_URL=http://127.0.0.1:3000 \
  ./node_modules/.bin/jest --testPathPattern="mixpanel/__test__/e2e"
```

Fixtures whose `expect.status` is `success` or `failure` need real partner secrets exported
(e.g. via `chamber`) — referenced only by name in the config as `{ $env: 'NAME' }`. Fixtures
whose `expect.status` is `error` run with **no secrets** (our code throws before any request
leaves), so they are a good smoke test of the whole pipeline.

Without `RUN_E2E`, the entrypoint uses `describe.skip`, so normal `yarn cloud test` and CI
stay green and require no serve server.

## Expectation shapes

- `success` — a request was sent and the partner returned 2xx. Optional `httpStatus`,
  `bodyContains`, `jsonContains` (partial deep match) against the outbound exchange's response.
- `failure` — a request was sent and the partner returned non-2xx (proves we correctly reject
  known-bad input). `httpStatus` required; optional `bodyContains` / `jsonContains`.
- `error` — our code threw before any request left (e.g. a missing required field). Assert
  `httpStatus` (the status the error class carries) and optionally `errorMessage`.

## Dynamic markers

`$now` (ISO timestamp), `$guid` (fresh UUID), `$guid:<name>` (UUID stable within one fixture
run) — resolved in events and mappings before each request.

## Boundary

The local serve runner asserts the **outbound HTTP exchange**. Segment's per-item
`MultiStatusResponse` is not returned by `serve`, so per-item MultiStatus index assertions are
a capability of the in-process / integrations gating harness, not this runner. `batch` and
`batchWithMultistatus` fixtures here assert the partner's batch HTTP response.
