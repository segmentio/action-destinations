# Testing

How a change proves it works before it merges.

## Outcome

A green build means the change works, and Claude gets fast feedback each time it tries a fix.

## Requirements

- TST-01: A change that alters behavior adds or updates a test of that behavior in the same PR.
- TST-02: CI runs the repo's tests on every PR.
- TST-03: A flaky test is made deterministic, or skipped with a link to a ticket.
- TST-06: Tests run with `TZ=UTC`, so snapshot output does not depend on the developer's timezone.
- TST-07: A cloud-mode destination test mocks its outbound HTTP calls with `nock`.

## Constraints

- TST-04: A failing CI step is never retried until it passes without a look at why it failed.
- TST-05: No test needs a real cloud account or production data.
