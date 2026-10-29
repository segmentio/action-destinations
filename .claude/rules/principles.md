# Principles

## Outcome

Review comments favor what protects customers and keeps the codebase predictable.

## Requirements

- PRI-01: Prefer framework features (conditionally required fields, mapping-kit directives for defaults, field validation formats) over hand-written checks in `perform`.
- PRI-02: Error messages are specific and actionable for the customer who sees them.
- PRI-03: Code on high-volume paths is efficient and respects API rate limits.
- PRI-04: Field labels and descriptions are clear, correctly spelled and grammatical, since customers read them in the UI.
- PRI-05: Match the surrounding code's naming, comment density and idiom.
- PRI-06: A PR does one thing. Unrelated cleanups go in a separate PR.
- PRI-07: Never log or expose tokens, secrets or PII.
