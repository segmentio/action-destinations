---
paths:
  - ".claude/rules/**"
---

# Writing rules

How the rule files in `.claude/rules/` are written, and how each rule gets a check.

## Outcome

A person and a fresh Claude session read a rule the same way, and a test or a single review question tells them whether a change breaks it.

## Requirements

- RUL-01: Each rule file opens with a title and a one-line scope, then has the sections Outcome, Requirements and Constraints in that order.
- RUL-02: A section with no rules holds the line `None yet.` and nothing else.
- RUL-03: The Outcome says in one to three sentences who gains what, in words no rule repeats.
- RUL-04: Each rule is one plain sentence with one intent, behind its ID.
- RUL-05: A rule the repo does not meet yet ends with `(not yet met)`.
- RUL-06: Every live rule ID has one entry in `.claude/rules/enforcement.yml` that says what enforces it.
- RUL-13: A rule file may end with a `## Notes` section after Constraints, for text that is not a rule, and no line there counts as a rule.

## Constraints

- RUL-07: A constraint never says what to do, only what to avoid, phrased with "never" or "no".
- RUL-08: An ID is never anything but its file's prefix and a two-digit number, and no two files share a prefix.
- RUL-09: No rule ID is defined in more than one place.
- RUL-10: A deleted rule's number is never reused, and its text becomes `Retired.` instead.
- RUL-11: No rule's text is copied into another file, which points to the rule by its ID instead.
- RUL-12: No rule a CI job checks is left `pending` or dropped from `enforcement.yml`.
