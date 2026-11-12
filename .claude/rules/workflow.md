# Change workflow

How a change gets from a branch to the default branch.

## Outcome

Every change on the default branch was reviewed and passed CI, and nothing irreversible happens without its owner.

## Requirements

- WFL-01: Every change reaches the default branch through a reviewed PR.
- WFL-03: A PR description says what changed and what shows it works.

## Constraints

- WFL-04: No one pushes directly to the default branch.
- WFL-05: An agent never merges a PR, force-pushes or deletes a branch without its owner's yes.
