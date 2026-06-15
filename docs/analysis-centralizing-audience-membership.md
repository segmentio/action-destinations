# Analysis of centralizing Audience Membership evaluation in actions-core

_Verified against `main` of `action-destinations`, `enrichment-service`, `personas-utils`, and `app` on 2026-06-15. Every claim below was checked against source; nothing is assumed._

## 1. Summary

`actions-core` now exposes a centralized helper, `resolveAudienceMembership` (`packages/core/src/audience-membership.ts`), which the destination-kit runtime calls automatically and injects into every action as `data.audienceMembership` (a `boolean`, or omitted when it cannot be resolved). The goal is for audience destinations to stop hand-rolling add/remove detection and instead consume one consistent signal.

**Conclusion:** the wiring is correct, the batch index alignment is sound, and the resolver is **complete for every `(syncMode, event)` pair the platform can actually deliver through the standard preset/subscription path**. The previously-suspected gaps in `retlAudienceMembership` are unreachable via the standard subscription because the app couples `syncMode` to the subscription FQL 1:1. There are two real correctness boundaries that any migration must respect (Section 5).

## 2. How the centralized code is wired

`packages/core/src/destination-kit/action.ts`:

- **Single** (`execute`, line ~363-366): 
  ```ts
  const syncModeVal = this.definition.syncMode ? bundle.mapping?.['__segment_internal_sync_mode'] : undefined
  const syncMode = isSyncMode(syncModeVal) ? syncModeVal : undefined
  const audienceMembership = resolveAudienceMembership(bundle.data, syncMode)
  ```
  Injected into the data bundle only when boolean: `...(typeof audienceMembership === 'boolean' ? { audienceMembership } : {})` (line 374).
- **Batch** (`executeBatch`, line ~476-478):
  ```ts
  const audienceMembership = bundle.data
    .map((d) => resolveAudienceMembership(d, syncMode))
    .filter((_, i) => !invalidPayloadIndices.has(i))
  ```
  Passed as the `audienceMembership` array (line 486).

**Two important facts confirmed:**

1. **`syncMode` is only read if the action defines a `syncMode` field** (`this.definition.syncMode` guard, lines 363 & 473). No field ⇒ `syncMode === undefined`.
2. **Batch alignment is safe.** `transformBatch` is `data.map(...)` (`mapping-kit/index.ts:483`) and `removeUndefined` on arrays is `.map(...)` (`remove-undefined.ts:9`) — both strictly 1:1 and order-preserving. `invalidPayloadIndices` are indices into that aligned array, so filtering `bundle.data` by them keeps `audienceMembership[i]` aligned with `payloads[i]`. Verified by the passing test "aligns audienceMembership correctly when one event fails validation".

## 3. The resolver logic

`resolveAudienceMembership(rawData, syncMode)` tries **Engage first, then RETL**:

- **`engageAudienceMembership`** — requires `context.personas.computation_class ∈ {audience, journey_step}` and a non-empty `computation_key`; returns the boolean at `traits[key]` (identify) or `properties[key]` (track). Returns `undefined` otherwise.
- **`retlAudienceMembership`** — requires a `syncMode` and `type === 'track'`; maps `(syncMode, event)` to a boolean (matrix in Section 4).

**Empirically on `main`, the two branches do not overlap for RETL.** Real RETL audience events carry no `computation_class` and no `properties[computation_key]` — only `event: 'new'|'updated'|'deleted'` plus the `__segment_internal_sync_mode` mapping (verified in `google-enhanced-conversions/__tests__/userList.test.ts`). So for RETL the Engage branch returns `undefined` and `retlAudienceMembership` is the active branch.

## 4. `retlAudienceMembership` completeness matrix

`syncMode ∈ {add, update, upsert, delete, mirror}`, RETL `event ∈ {new, updated, deleted}`:

|        | new        | updated    | deleted    |
|--------|------------|------------|------------|
| add    | **true**   | undefined  | undefined  |
| update | undefined  | **true**   | undefined  |
| upsert | **true**   | **true**   | undefined  |
| delete | undefined  | undefined  | **false**  |
| mirror | **true**   | **true**   | **false**  |

The `undefined` cells look like gaps, **but they are unreachable through the standard path.** The app couples `syncMode` to the subscription FQL trigger 1:1 (`app .../ReverseETL/AddMappingsWizard/SyncModeSelection.tsx`, `getTriggerValue`/`getSyncModeValue`). The `SelectedTrigger` enum values _are_ the FQL event filters:

```
DELETED = 'deleted'
NEW = 'new'
UPDATED = 'updated'
UPSERTED = 'new or updated'
MIRROR = 'new or updated or deleted'
```

So a `syncMode=add` connection only ever receives `event=new`; `delete` only `deleted`; etc. Every deliverable pair lands on a bolded (boolean) cell. **The resolver is therefore complete for the standard preset/subscription path.**

Engage and Journeys paths resolve via the boolean directly (`traits[key]`/`properties[key]`), independent of this matrix — except `journeys_step_entered_track`, which carries **no** membership boolean (verified in `personas-utils/tracking/tracking.go` `TrackModeJourneyStep` case, ~lines 435-446) and therefore resolves to `undefined`. Journeys V1 must be treated as "always add" by the destination (see FCA `getJourneysMemberships`).

## 5. Two correctness boundaries any migration must respect

1. **A migrated destination MUST define a `syncMode` field to support RETL.** Without it, `syncMode` is forced to `undefined` (action.ts:363), `retlAudienceMembership` returns `undefined` for all RETL events, and Engage also returns `undefined` (no boolean in RETL payloads) — RETL membership becomes unresolvable.
2. **`undefined` can be fatal in strict consumers.** DV360's `validateMembership` (`display-video-360/shared.ts:274-284`) throws `PayloadValidationError` and **fails the entire batch** if any membership cell is not a boolean. This is safe today (gaps unreachable, Journeys handled separately) but is fragile against custom/non-standard subscriptions that decouple `event` from `syncMode`, or against `journeys_step_entered_track` traffic. Migrations should decide an explicit policy for `undefined` (FCA errors per-row; DV360 throws for the batch).

## 6. Destinations: already migrated vs. needs migration

Scope: the destinations carrying the Engage/Entity/Journeys presets, **excluding** the 5 that should have their `journeys_step_entered_track` preset removed (not migrated): `reddit-audiences`, `dynamic-yield-audiences`, `snap-audiences`, `taboola-audiences`, `yahoo-audiences`.

### Already consuming `data.audienceMembership` (3)

| Destination (slug) | Notes |
|---|---|
| `actions-facebook-custom-audiences` | `sync` action consumes `audienceMembership`; has `syncMode` field; Journeys V1 handled via `getJourneysMemberships`. Reference implementation. |
| `actions-display-video-360` | `syncAudience` action consumes it; strict `validateMembership` (throws on non-boolean / length mismatch). |
| `actions-tiktok-audiences` | `syncAudience` (combined add/remove) action consumes it. |

### Needs migration (17)

| Destination (slug) | Has `syncMode` field today? | Migration note |
|---|---|---|
| `actions-amazon-amc` | no | Add `syncMode` field if RETL support needed. |
| `actions-s3-csv` (aws-s3) | no | Add `syncMode` field if RETL support needed. |
| `actions-braze-cloud` (braze) | **yes** | Has `syncMode`; wire perform/Batch to `audienceMembership`. |
| `actions-customerio` | no | Add `syncMode` field if RETL support needed. |
| `actions-delivrai-audiences` (delivrai-activate) | no | Add `syncMode` field if RETL support needed. |
| `actions-dotdigital-audiences` | no | Add `syncMode` field if RETL support needed. |
| `actions-first-party-dv360` | no | Currently 1-way actions; consolidating to one action + membership recommended. |
| `actions-google-enhanced-conversions` | **yes** | Has its own `event_name`/`syncMode` logic today; switch to core `audienceMembership` + add Journeys handling. |
| `actions-iterable` | no | Add `syncMode` field if RETL support needed. |
| `actions-iterable-audiences` | no | Add `syncMode` field if RETL support needed. |
| `actions-iterable-lists` | no | Add `syncMode` field if RETL support needed. |
| `actions-klaviyo` | no | Currently 1-way actions; consolidate + membership. |
| `actions-liveramp-audiences` | no | Add `syncMode` field if RETL support needed. |
| `actions-marketo-static-lists` | no | Currently 1-way actions; consolidate + membership. |
| `actions-pendo-audiences` | no | Add `syncMode` field if RETL support needed. |
| `actions-sendgrid-audiences` | no | Reads `traits_or_props[key]` today (Engage-equivalent); add `syncMode` for RETL. |
| `actions-webhook-audiences` | no | Add `syncMode` field if RETL support needed. |

### Excluded — remove `journeys_step_entered_track` preset instead of migrating (5)

`reddit-audiences` (GA), `dynamic-yield-audiences` (Public Beta), `snap-audiences` (Public Beta), `taboola-audiences` (Public Beta), `yahoo-audiences` (Public Beta) — none are enabled for Journeys; the preset was added in error.

## 7. Recommended migration checklist (per destination)

1. Ensure the action defines a `syncMode` field (required for RETL membership resolution).
2. Consume `data.audienceMembership` (single) / `data.audienceMembership[]` (batch) instead of reading `traits_or_props[computation_key]` or `event_name`/`syncMode` by hand.
3. Decide and implement an explicit policy for `undefined` membership (error the row vs. discard vs. default), mirroring FCA.
4. Handle `journeys_step_entered_track` if the destination is Journeys-enabled: treat journey_step events with no boolean as "add" (cf. FCA `getJourneysMemberships`), since core returns `undefined` for them.
5. Keep batch membership indexed against the **post-validation** payload array (core already does this; don't re-index against raw batch).
6. Add tests covering: Engage identify/track add+remove, RETL `new`/`deleted` (+`updated`/`mirror`), and Journeys V1 (no boolean).
