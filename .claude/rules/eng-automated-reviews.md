# Automated reviews

What stops the Claude review agent from reviewing a PR here: the blocking review readiness rules, named in brackets.

## Outcome

A PR that asks for an automated review gets one, not a "not ready" notice.

## Requirements

- EAR-01 [RR-17]: A PR changes at most 2,000 lines, or the review config's limit, not counting pinned vendored code on a PR into the default branch; a bigger change is split.
- EAR-02 [RR-02]: A root `CLAUDE.md` or `AGENTS.md` says what the repo is and how to build and test it.
- EAR-03 [RR-12]: The test and lint commands are written in the README, a Makefile or `CLAUDE.md`.
- EAR-04 [RR-11]: `.claude/review-toolkit.yml` lists existing files under `review_context.files`, under 40 KB in total.
- EAR-07 [RR-18]: The root `catalog-info.yaml` names a `spec.owner`, or is a `Location` whose targets do.

## Constraints

- EAR-05 [RR-11]: No globs and no `CLAUDE.md` in `review_context.files`.
- EAR-06 [RR-01]: Never archive the repo or remove the review App's read access.
