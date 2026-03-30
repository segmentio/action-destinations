# Security Issue: Internal Infrastructure Requests Exposed in Event Tester

|                 |                          |
| --------------- | ------------------------ |
| **Date**        | 2026-03-18               |
| **Reported by** | Destinations Team        |
| **Audience**    | Centrifuge Platform Team |
| **Severity**    | High                     |

---

## Summary

When sending a test event to the `actions-webhook-extensible` destination via the Event Tester, internal platform infrastructure HTTP calls are surfaced in the "Requests" panel alongside the actual destination API call.

These calls expose sensitive Segment-internal information — production bucket names, IAM role ARNs, AWS account IDs, and internal path structures — that should never be visible to any user.

**Root cause:** The Event Tester captures HTTP traffic at the Node.js `http`/`https` module level, which intercepts **all** outgoing requests during event processing — including internal AWS credential refreshes and secret-fetching operations — not just requests to the destination endpoint.

---

## Observed Request Sequence

| Step | Request                    | Method | Endpoint                                                                       | Should Be Visible? |
| ---- | -------------------------- | ------ | ------------------------------------------------------------------------------ | ------------------ |
| 1    | AWS STS credential refresh | POST   | `https://sts.us-west-2.amazonaws.com/`                                         | No — internal      |
| 2    | S3 OAuth secrets fetch     | GET    | `https://segmentio-partners-secrets-production.s3.us-west-2.amazonaws.com/...` | No — internal      |
| 3    | Destination API call       | varies | Customer-configured endpoint                                                   | **Yes — intended** |

Only step 3 should appear in the Event Tester UI.

---

## Request 1 — AWS STS Credential Refresh

| Field              | Observed Value                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| Method             | POST                                                                           |
| URL                | `https://sts.us-west-2.amazonaws.com/`                                         |
| Action             | `AssumeRoleWithWebIdentity`                                                    |
| Role ARN           | `arn:aws:iam::752180062774:role/centrifuge-destinations.usw2.eks.integrations` |
| Role Session Name  | `aws-sdk-js-session-<timestamp>`                                               |
| Web Identity Token | REDACTED in UI (field still visible)                                           |
| AWS SDK Version    | `aws-sdk-js/3.212.0`                                                           |

### What This Exposes

| Information           | Value                                          | Sensitivity |
| --------------------- | ---------------------------------------------- | ----------- |
| AWS account ID        | `752180062774`                                 | High        |
| EKS cluster region    | `usw2` (us-west-2)                             | Medium      |
| Internal service name | `centrifuge-destinations`                      | Medium      |
| Infrastructure type   | EKS with IRSA (IAM Roles for Service Accounts) | Medium      |

### Origin

The AWS SDK's default credential provider chain fires `fromWebIdentity` when an SDK client (`STSClient`, `S3Client`, etc.) is initialised without explicit credentials. On EKS with IRSA this automatically exchanges the pod's web identity token for temporary AWS credentials via STS. This is a fully internal AWS SDK operation, not a destination API call.

---

## Request 2 — S3 OAuth Secrets Fetch

| Field                | Observed Value                                                                      |
| -------------------- | ----------------------------------------------------------------------------------- |
| Method               | GET                                                                                 |
| Bucket               | `segmentio-partners-secrets-production`                                             |
| Key                  | `actions-webhook-extensible/69ba3780d0c37652e77c4d8a/default/clientCredential.json` |
| Authorization        | REDACTED in UI                                                                      |
| X-Amz-Security-Token | REDACTED in UI                                                                      |

### What This Exposes

| Information                    | Value                                                             | Sensitivity |
| ------------------------------ | ----------------------------------------------------------------- | ----------- |
| Production secrets bucket name | `segmentio-partners-secrets-production`                           | High        |
| Internal S3 key schema         | `<destination-slug>/<destination-id>/<env>/clientCredential.json` | High        |
| Destination instance ID        | `69ba3780d0c37652e77c4d8a`                                        | Medium      |
| Secret storage mechanism       | OAuth credentials stored as JSON files in S3                      | High        |

### Origin

Centrifuge fetches the destination's OAuth `clientId`/`clientSecret` from S3 before processing the event. This is a platform-internal operation that happens as part of the event pipeline setup, prior to the actual destination API call.

---

## Root Cause Analysis

| Component                    | Issue                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Event Tester request capture | Hooks into Node.js `http`/`https` module level, capturing all outgoing traffic — not scoped to destination API calls only          |
| Request 1 — STS              | AWS SDK auto-credential chain fires `fromWebIdentity` on EKS/IRSA when SDK clients are initialised without pre-fetched credentials |
| Request 2 — S3               | Centrifuge loads OAuth secrets from S3 as part of its internal event processing pipeline before the destination is invoked         |

---

## Risk Assessment

| Risk                                   | Detail                                                                                                                            | Severity |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Production bucket name disclosure      | `segmentio-partners-secrets-production` is a production secrets store; knowing the name aids targeted reconnaissance and attacks  | High     |
| S3 key structure disclosure            | Reveals how secrets are organized across all destinations, enabling enumeration attempts if bucket-level controls ever fail       | High     |
| IAM role ARN and account ID disclosure | Enables an attacker to understand the blast radius of a credential compromise and craft targeted assume-role attacks              | High     |
| Destination instance ID exposure       | Ties a specific customer destination ID to a known file path in a production bucket                                               | Medium   |
| Scope of impact                        | Reproducible for any destination using OAuth credentials stored via this S3 pattern — not limited to `actions-webhook-extensible` | High     |

---

## Recommended Fixes

| Action                                                                                                                | Owner                 | Priority |
| --------------------------------------------------------------------------------------------------------------------- | --------------------- | -------- |
| Scope Event Tester request capture to destination API calls only — start capture after credential loading is complete | Centrifuge / Platform | High     |
| Suppress all requests to `*.amazonaws.com` from the Event Tester display as a short-term mitigation                   | Centrifuge / Platform | High     |
| Suppress requests to `kubernetes.default.svc` and `169.254.169.254` (EC2 metadata) from the Event Tester display      | Centrifuge / Platform | High     |
| Audit other destinations and event flows for the same internal call leakage                                           | Destinations Team     | Medium   |

### Suggested Host-Based Filter (short-term mitigation)

Suppress any captured request from the Event Tester display if the host matches:

- `*.amazonaws.com`
- `kubernetes.default.svc`
- `169.254.169.254`

---

## Notes

- `WebIdentityToken`, `Authorization`, `X-Amz-Security-Token`, and `User-Agent` headers are already redacted in the Event Tester UI, indicating that some filtering logic exists today but is incomplete — it redacts header values but does not suppress internal requests entirely.
- No credential values are currently exposed in plain text. The risk is structural and metadata disclosure.
- This issue is in the Centrifuge platform, not in the `action-destinations` repository. No changes are required in `action-destinations` to resolve it.

Security Issue: Internal Infrastructure Leaking in Event Tester

What happened: When using Segment's Event Tester UI with the actions-webhook-extensible destination, internal AWS  
 infrastructure calls are being exposed in the "Requests" panel — visible to users who should never see them.

The Leak

The Event Tester captures HTTP traffic at the Node.js http/https module level, which means it intercepts all outgoing network
requests — not just the destination API call. This inadvertently surfaces two internal requests:

1. AWS STS credential refresh — The AWS SDK auto-refreshes IAM credentials via AssumeRoleWithWebIdentity on EKS. This  
   exposes:


    - AWS account ID (752180062774)
    - IAM role ARN revealing the internal service name (centrifuge-destinations)
    - EKS cluster region and infrastructure type

2. S3 OAuth secrets fetch — Centrifuge fetches the destination's clientId/clientSecret from S3 before processing. This  
   exposes:


    - Production secrets bucket name (segmentio-partners-secrets-production)
    - Internal S3 key schema (<destination-slug>/<destination-id>/<env>/clientCredential.json)
    - Destination instance ID


Why It Matters

No raw credential values leak (they're already redacted), but the structural metadata is serious — it reveals bucket names,  
 IAM ARNs, AWS account IDs, and the internal secret storage pattern. This enables reconnaissance/attack targeting even without
direct credential access.

Key Takeaways

- Root cause is in Centrifuge/Platform, not in action-destinations — no changes needed in this repo
- The fix requires scoping Event Tester request capture to start after credential loading, or suppressing \*.amazonaws.com
  requests from the display
- Any destination using OAuth via S3 is potentially affected, not just actions-webhook-extensible
- Some redaction already exists (token values are masked), but it's incomplete — it needs to suppress the requests entirely,
  not just redact headers  


❯ can the changes in event tester will resolve this ?

⏺ Based on the document, yes — changes in the Event Tester are the correct and sufficient fix. Here's the breakdown:

What the doc says

▎ "This issue is in the Centrifuge platform, not in the action-destinations repository. No changes are required in  
 action-destinations to resolve it."

The root cause is that the Event Tester hooks into the Node.js http/https module too early — before credential loading is  
 done — so it captures everything.

Two approaches to fix it (both in Event Tester / Centrifuge):

Option 1 — Structural fix (proper solution)  
 Start request capture after credential loading is complete, so only the actual destination API call is ever captured.

Option 2 — Short-term mitigation (quick win)  
 Suppress captured requests from display if the host matches:

- \*.amazonaws.com
- kubernetes.default.svc
- 169.254.169.254  


What won't resolve it

Changes in action-destinations cannot fix this because:

- The STS credential refresh is triggered by the AWS SDK automatically (IRSA on EKS)
- The S3 secrets fetch is done by Centrifuge's internal pipeline before the destination code even runs
- Neither of those operations lives in this repo  


So the fix is entirely owned by the Centrifuge/Platform team, and Event Tester changes alone would fully resolve the leakage
