Generate an API version report for destinations in this repository.

The argument is: $ARGUMENTS

- If `$ARGUMENTS` is empty or the literal word `all`, run in **ALL-DESTINATIONS mode**: report on every destination in the repo (no API doc checks — too many to be practical).
- If `$ARGUMENTS` is a specific slug, run in **SINGLE-DESTINATION mode**: report on just that destination, including full API doc checks (Phase 4).

Do all file reads and greps yourself — do not ask the user to do them.

---

## ALL-DESTINATIONS MODE

### Step A — Enumerate all destinations

Use Glob to list every immediate subdirectory of:

- `packages/destination-actions/src/destinations/` → mode: `cloud`
- `packages/browser-destinations/destinations/` → mode: `browser`

Collect a list of `{ slug, dest_dir, mode }` entries. Skip any directory named `__mocks__`, `__tests__`, or `index.ts`.

### Step B — Collect version signals for each destination

For every destination in the list, run all 4 signal strategies (described below in the shared section). This is the same as Phases 2A–2D in single-destination mode.

Collect results as: `{ slug, dest_dir, mode, signals[] }` where each signal has:

- `signal_type`: `named_constant | http_header | inline_url`
- `name`: constant name or header key
- `value`: the version value
- `defined_at`: `file:line`
- `api_reference_url`: if available

### Step C — Build usage map for named constants

For each `named_constant` signal found across all destinations, grep within that destination's directory for the constant name to find usage locations (excluding the definition line and `generated-types.ts`).

### Step D — Render the all-destinations report

Output this Markdown report:

```markdown
# API Version Report: All Destinations

**Report generated**: <today's date>
**Cloud destinations scanned**: <N>
**Browser destinations scanned**: <N>
**Destinations with version signals**: <N>
**Destinations with no version signals**: <N>

---

## Repo-Wide Summary

| Destination | Mode          | Signal           | Value     | Signal Type                           | API Reference      |
| ----------- | ------------- | ---------------- | --------- | ------------------------------------- | ------------------ |
| <slug>      | cloud/browser | <name or header> | `<value>` | named_constant/http_header/inline_url | [link](url) or N/A |

(One row per signal. Sort by destination slug.)

---

## Per-Destination Details

### <slug> (`<mode>`)

**Directory**: `<dest_dir>`

| Signal | Value     | Signal Type | Defined At      | API Reference |
| ------ | --------- | ----------- | --------------- | ------------- |
| <name> | `<value>` | <type>      | `<file>:<line>` | [link] or N/A |

<For each named_constant signal, list usage locations:>
**<constant_name>** used in:

- `<file>:<line>`
- ...

---

### <next slug> ...

---

## Destinations With No Version Signals (<N>)

<comma-separated list of slugs>

> These destinations use versionless APIs, embed the version in auth configuration, or version through a dependency not visible in source.

---

## Notes

- API documentation checks (deprecation status, latest version) are skipped in all-destinations mode. Run `/api-version-report <slug>` for a single destination to get full doc checks.
- Browser destinations may delegate versioning to an SDK dependency.
```

---

## SINGLE-DESTINATION MODE

### Phase 1 — Locate destination

1. Check if `packages/destination-actions/src/destinations/<slug>/` exists (cloud-mode).
2. If not, check if `packages/browser-destinations/destinations/<slug>/src/` exists (browser-mode).
3. If neither exists, output: `Error: Destination "<slug>" not found. Check the slug and try again.` and stop.

Record:

- `DEST_DIR`: the directory found
- `DEST_MODE`: `cloud` or `browser`

### Phase 2 — Collect version signals

Run all 4 strategies in parallel.

#### 2A — versioning-info.ts (primary)

Read `<DEST_DIR>/versioning-info.ts` if it exists.

For each `export const` declaration, extract:

- **constant_name**: the identifier
- **value**: the string/number literal value
- **description**: text from the JSDoc comment block above it
- **api_reference_url**: URL from a `API reference:` line in the JSDoc
- **release_notes_url**: URL from a `Release notes:` line in the JSDoc (if present)
- **defined_at**: `<file>:<line>` of the `export const` line

#### 2B — constants.ts / properties.ts (secondary)

Read `<DEST_DIR>/constants.ts` and `<DEST_DIR>/properties.ts` if they exist.

For each `export const` whose name contains `VERSION` or `API_VER` (case-insensitive), extract the same fields as 2A.

Also note any string literal values that contain `/v1`, `/v2`, `/v3` (etc.) path segments in a URL — record these as inline URL signals.

#### 2C — HTTP header versioning (index.ts)

Read `<DEST_DIR>/index.ts`.

Scan all `extendRequest` return values and any `headers:` objects for:

- Keys matching: `LD-API-Version`, `X-Api-Version`, `X-API-Version`, `Api-Version`, `API-Version`, or any header key containing `version` (case-insensitive)
- `Accept` header values that contain `version=`

For each match, record:

- **signal_type**: `http_header`
- **header_name**: the header key
- **value**: the header value
- **defined_at**: `<file>:<line>`

#### 2D — Inline versioned URLs (grep fallback)

Use Grep to search all `.ts` files under `<DEST_DIR>` (exclude `__tests__/` subdirectories and `generated-types.ts`) for the pattern:

```
https?://[^\s'"]+/v[0-9]+[./'"` \s]
```

For each unique URL found (de-duplicate), record:

- **signal_type**: `inline_url`
- **url**: the URL (trimmed)
- **defined_at**: `<file>:<line>`

### Phase 3 — Build usage map

For each named constant found in Phase 2A/2B:

- Grep all `.ts` files under `<DEST_DIR>` for the constant name as a whole word
- Collect every `file:line` reference (exclude the definition line itself, exclude `generated-types.ts`)
- Record as **usage_locations**

For each inline URL entry from 2D:

- Grep for the literal URL string across `<DEST_DIR>` `.ts` files
- Collect all `file:line` matches

### Phase 4 — Check API docs

For each version signal that has an `api_reference_url`:

1. **WebFetch** the URL. Ask: "What is the current/latest version of this API? Is version `<value>` deprecated or sunset? If deprecated, since when and what is the sunset date?"
2. If WebFetch fails or returns no useful version info, fall back to **WebSearch**: `"<destination name> API version <value> deprecated sunset"`
3. Record:
   - `is_deprecated`: YES / NO / UNKNOWN
   - `deprecated_since`: date string or UNKNOWN
   - `sunset_date`: date string or UNKNOWN
   - `latest_version`: version string or UNKNOWN
   - `doc_note`: 1–2 sentence summary from docs

For signals without a reference URL (http headers, inline URLs without JSDoc), note `doc_check: SKIPPED — no reference URL` unless you can infer the API docs URL from the destination name.

### Phase 5 — Render single-destination report

Output a complete Markdown report with this structure:

```markdown
# API Version Report: <slug>

**Destination directory**: `<DEST_DIR>`
**Destination mode**: <cloud|browser>
**Report generated**: <today's date>

## Summary

| Constant / Signal | Current Value | API Reference      | Deprecated?      | Latest Version       |
| ----------------- | ------------- | ------------------ | ---------------- | -------------------- |
| <name>            | `<value>`     | [link](url) or N/A | <YES/NO/UNKNOWN> | <version or UNKNOWN> |

## Detailed Findings

### <signal name or header name>

- **Signal type**: <named_constant | http_header | inline_url>
- **Current value**: `<value>`
- **Description**: <JSDoc description, or "HTTP header used for API versioning", or "Inline URL with versioned path">
- **Defined in**: `<file>:<line>`
- **API reference**: <url or "none">

**Used in** (<N> locations):

- `<file>:<line>`
- ...

**API Documentation Check**:

- Is version `<value>` deprecated? <YES/NO/UNKNOWN>
- Latest available version: <version or UNKNOWN>
- Deprecated since: <date or N/A>
- Sunset date: <date or N/A>
- Note: <doc_note>

---

## Edge Case Observations

<bullet list of any of the following that apply>
- No `versioning-info.ts` found — phases 2B–2D were the primary source
- Canary + production version constants found (both reported separately)
- Browser destination — SDK or client library may own versioning independently
- WebFetch failed for <url> — fell back to WebSearch
- WebSearch returned no useful version info for <signal> — marked UNKNOWN
- No version signals found — this destination may use a versionless API or embed version in auth
- The following signals had no API reference URL: <list>
```

---

## Important notes (both modes)

- If the same URL appears in both 2B and 2D, report it once (prefer the named constant entry).
- A canary version constant (name contains `CANARY`) paired with a production version constant pointing to the same API reference is a known pattern — call it out explicitly.
- The report date should use today's date from the system context.
- Be specific with `file:line` references — these are actionable navigation targets.
- In all-destinations mode, if a destination has no version signals, include it in the "no signals" list at the end rather than a full section.
