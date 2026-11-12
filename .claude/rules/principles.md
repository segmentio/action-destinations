# Principles

How to choose when no other rule in `.claude/rules/` decides.

## Outcome

Changes stay small and look like the rest of the repo, so a reviewer spends their time on intent instead of style.

## Requirements

- PRI-01: A change follows the pattern the repo already uses for the same job.
- PRI-02: A PR that departs from that pattern says why in its description.
- PRI-03: A change does what its task asks and nothing more.

## Constraints

- PRI-04: No error handling for a case that cannot happen.
- PRI-05: No refactor of untouched code inside a bug fix.
- PRI-06: No TODO comment is left for later work. (not yet met)
