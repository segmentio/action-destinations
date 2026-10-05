<!-- Hello and thank you for contributing to Segment action-destinations! -->

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
     on, off, and partial rollout. -->

- [ ] Added [unit tests](https://github.com/segmentio/action-destinations/blob/main/docs/testing.md#local-end-to-end-testing) for new functionality
- [ ] Tested end-to-end using the [local server](https://github.com/segmentio/action-destinations/blob/main/docs/testing.md#local-end-to-end-testing)
- [ ] [Segmenters] [If applicable for this change] Tested for regression with Hadron.

### Deployment Plan

<!-- How/where the change is deployed, and any linked PRs, flags, gates, or cob vars that must land
     or change together. -->

### Verification Plan

<!-- How you will confirm the change is healthy in production: dashboard links, metrics monitored,
     and/or prod tests. Aim for ~3 independent signals. Required complement to the Test Plan. -->

### Rollback Plan

<!-- Clear steps any teammate can execute to roll back quickly. Test risky rollbacks in staging. -->

### Risk Mitigation

<!-- Actions taken to reduce the risk of this change. -->

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

### Change Control Checklist

- [ ] **Feature flag / gate** — risky or high-volume changes gated behind a flag: name `<flag-name>`, registered in Flagon, defaults to **off**; rollout & flag-cleanup plan documented (or N/A)
- [ ] **+2 code review approvals** before merge (two +1s from different reviewers, or one +2 from an SME)
- [ ] **AI deep review** completed — Claude deep review and Copilot code review run on this PR, and their Change Release Safety findings addressed or explicitly resolved
- [ ] **Non-code production changes** (config, Flagon gates/flags, cob vars, Terraform, AWS console, prod DB reads/writes, scripts) have ≥1 approval; pairing for script execution & DB writes
- [ ] **Director approval** obtained for major/risky changes (skipping staging, DB restore, possible data loss, COGS infra, maintenance windows) — or N/A

## Security Review

_Please ensure sensitive data is properly protected in your integration._

- [ ] **Reviewed all field definitions** for sensitive data (API keys, tokens, passwords, client secrets) and confirmed they use `type: 'password'`

## New Destination Checklist

- [ ] Extracted all action API versions to `verioning-info.ts` file. [example](https://github.com/segmentio/action-destinations/blob/main/packages/destination-actions/src/destinations/facebook-conversions-api/versioning-info.ts)
