<!-- Hello and thank you for contributing to Segment action-destinations! -->

<!-- Before opening your pull request, make sure you have added and ran unit
     tests and tested your change locally. Refer to our testing
     documentation for more information: https://github.com/segmentio/action-destinations/blob/main/docs/testing.md -->

<!-- If you have questions or issues please open a new issue or create a new discussion
     post in Github. -->

_A summary of your pull request, including the what change you're making and why._

## Change Release Safety

<!-- Per the Segment Change Release Safety guidelines, every PR that can reach production must
     include the four plans below plus risk mitigation, in enough detail that another engineer
     could reproduce them. Vague entries ("Tested in stage", "Auto deployed", "N/A") are not
     acceptable and will be flagged in review. Segmenter-only sections may be marked N/A by
     external/partner contributors. -->

### Test Plan

<!-- Environment(s) used and tests run / metrics verified. Segmenter changes must be tested in
     staging first, with enough bake time for end-to-end tests to complete. Cover flag/gate states:
     on, off, and partial rollout. For high-volume destinations (Facebook, Google, Snapchat),
     Segmenters should use a feature flag to roll out safely. -->

- [ ] Added [unit tests](https://github.com/segmentio/action-destinations/blob/main/docs/testing.md#local-end-to-end-testing) for new functionality
- [ ] Tested end-to-end using the [local server](https://github.com/segmentio/action-destinations/blob/main/docs/testing.md#local-end-to-end-testing)

### Deployment Plan

<!-- How/where the change is deployed, and any linked PRs, flags, or gates that must land
     or change together. -->

### Verification Plan

<!-- How you will confirm the change is healthy in production: dashboard links, metrics monitored,
     and/or prod tests. Aim for ~3 independent signals. Required complement to the Test Plan. -->

### Rollback Plan

<!-- Clear steps any teammate can execute to roll back quickly. Test risky rollbacks in staging. -->

### Risk Mitigation

<!-- Actions taken to reduce risk (e.g. feature flag/gate behavior and how it protects the change). -->

### Breaking Change & Customer Impact

<!-- Does this change alter behavior that customers depend on? State explicitly:
     - Is it a breaking change? (schema/field changes, new required fields, removed/renamed
       fields, changed defaults, API or version bumps, altered mapping output, auth or
       rate-limit changes, dropped events). New required fields ARE a breaking change.
     - Who is affected — which destinations/integrations, customer segments, or event
       volumes, and notably any top enterprise customers.
     - Customer-visible impact — data loss, delivery failures, duplicate/missing events,
       downstream schema breakage, or silent behavior changes.
     - Backward-compatibility / migration path — how existing customers are protected
       (gating, versioning, opt-in, deprecation notice / comms).
     Write "Not a breaking change - no customer impact" only after doing this analysis. -->

## Approvals & Review

See the [Change Release Safety guidelines](https://docs.google.com/document/d/1N2MtcLtiI7MK_GgwEe1tXtDYrMZnbfJCVyFvVoof-Ss/edit?tab=t.0#heading=h.dyt1m85tc50l).

- [ ] **+2 code review approvals** before merge (two +1s from different reviewers, or one +2 from an SME)
- [ ] AI deep review (Claude and Copilot) run on this PR, and Change Release Safety findings addressed
- [ ] Any additional approvals required by the guidelines obtained (or N/A)

## Security Review

_Please ensure sensitive data is properly protected in your integration._

- [ ] **Reviewed all field definitions** for sensitive data (API keys, tokens, passwords, client secrets) and confirmed they use `type: 'password'`

## Feature flag / Rollout

_Risky or high-volume changes must be gated behind a feature flag. Confirm the details below. External/partner contributors: work with your Segment engineer contact to decide whether a flag is needed and to plan the rollout._

- [ ] This change is **not** gated behind a feature flag (N/A)
- [ ] Flag name: `<flag-name>`
- [ ] Flag is registered and defaults to **off**
- [ ] Rollout, rollback, and flag-cleanup plan described in the Deployment and Rollback Plans above

## New Destination Checklist

- [ ] Extracted all action API versions to `verioning-info.ts` file. [example](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/facebook-conversions-api/versioning-info.ts)
