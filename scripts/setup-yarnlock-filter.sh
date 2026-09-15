#!/bin/sh
# One-time, MANUAL setup for Twilio/internal engineers.
#
#     sh scripts/setup-yarnlock-filter.sh   # run once per clone, BEFORE `yarn install`
#     yarn install
#
# WHY THIS EXISTS
# --------------------------------------------------------------------------
# This is a public repo with external contributors, so the committed yarn.lock
# must point at the public registry.yarnpkg.com. But Twilio laptops are locked
# down and can only install through the internal JFrog Artifactory npm proxy,
# and yarn v1 fetches the exact "resolved" URL in the lockfile — so a fresh
# clone with public URLs fails on a Twilio laptop with ECONNREFUSED.
#
# This script registers a git clean/smudge filter (in this clone's local
# .git/config, which is never committed):
#   * smudge: public registry.yarnpkg.com -> Artifactory, in the working tree,
#     so `yarn install` can fetch.
#   * clean:  Artifactory -> public, on every status/diff/commit, so `git status`
#     stays clean and no internal URL is ever committed.
#
# WHY IT IS MANUAL AND NOT WIRED INTO `yarn install`
# --------------------------------------------------------------------------
# The Artifactory registry lives only in the npm_config_registry environment
# variable on Twilio machines. yarn v1 OVERWRITES that variable with its own
# default (https://registry.yarnpkg.com) for every script it runs, so anything
# launched by yarn (prepare/postinstall) can't see the real registry. It must
# be run directly from your shell. External contributors simply never run it.

set -e

# The internal Artifactory npm proxy. Hardcoded on purpose (see "WHY IT IS
# MANUAL" above): we cannot reliably read it from the environment.
ARTIFACTORY_REGISTRY="https://npmjs.artifacts.twilio.com/artifactory/api/npm/virtual-npm-twilio/"
ARTIFACTORY_HOST="npmjs.artifacts.twilio.com"

fail() { echo "ERROR: $1" >&2; exit 1; }

# --- Check 1: we are inside the repo's git work tree ---------------------
git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || fail "not inside a git work tree — run this from the action-destinations repo root."
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# --- Check 2: the files the filter depends on are present ----------------
[ -f yarn.lock ] || fail "yarn.lock not found in $REPO_ROOT."
[ -f scripts/localize-yarn-lock-registry.sh ] || fail "scripts/localize-yarn-lock-registry.sh missing."
[ -f scripts/normalize-yarn-lock-registry.sh ] || fail "scripts/normalize-yarn-lock-registry.sh missing."

# --- Check 3: this is an internal (Artifactory) machine ------------------
# npm's registry view is used ONLY as an "am I an internal machine?" signal.
# Run this directly in your shell (NOT via `yarn`), or this check misfires.
CURRENT_REGISTRY=$(npm config get registry 2>/dev/null || true)
case "$CURRENT_REGISTRY" in
  *"$ARTIFACTORY_HOST"*) ;;  # internal — proceed
  *)
    echo "This machine's npm registry is not the Twilio Artifactory proxy."
    echo "  detected: ${CURRENT_REGISTRY:-<none>}"
    echo
    echo "  • EXTERNAL contributor? Nothing to do — the committed yarn.lock"
    echo "    already uses the public registry. Ignore this script."
    echo
    echo "  • TWILIO machine? Run this DIRECTLY in your shell, not via 'yarn',"
    echo "    because yarn overrides the npm registry env var for its scripts."
    exit 0
    ;;
esac

# --- Check 4: the Artifactory host is actually reachable -----------------
# Non-fatal: warn early if it's not (VPN off, network issue) so the failure
# mode is obvious rather than a confusing yarn error later.
if command -v curl >/dev/null 2>&1; then
  if ! curl -s --max-time 8 -o /dev/null "$ARTIFACTORY_REGISTRY"; then
    echo "WARNING: could not reach ${ARTIFACTORY_HOST} (VPN off? network down?)."
    echo "         Registering anyway, but 'yarn install' will fail until it is reachable."
  fi
fi

# --- Register the filter (idempotent) ------------------------------------
echo "Registering yarn.lock registry filter -> ${ARTIFACTORY_REGISTRY}"
git config filter.yarnlock-registry.clean    'sh scripts/normalize-yarn-lock-registry.sh'
git config filter.yarnlock-registry.smudge   'sh scripts/localize-yarn-lock-registry.sh'
# Never mark the filter 'required': on machines without it (external, CI) git
# must fall back to identity passthrough, not error.
git config filter.yarnlock-registry.required false
git config filter.yarnlock-registry.registry "$ARTIFACTORY_REGISTRY"

# --- Re-materialize yarn.lock through the smudge -------------------------
# A plain `git checkout -- yarn.lock` is a no-op when git sees no diff, so
# remove it first to force git to rewrite it through smudge. Guard on
# `git diff --quiet` (which applies the clean filter first) so this only runs
# when there are no real, content-level changes to lose.
if git diff --quiet -- yarn.lock 2>/dev/null; then
  rm -f yarn.lock
  git checkout -- yarn.lock
else
  echo "NOTE: yarn.lock has uncommitted changes; leaving contents as-is"
  echo "      (the clean filter still normalizes them to public URLs on commit)."
fi

# --- Verify --------------------------------------------------------------
echo
echo "Verification:"
FIRST_RESOLVED=$(grep -m1 'resolved ' yarn.lock 2>/dev/null || true)
case "$FIRST_RESOLVED" in
  *"$ARTIFACTORY_HOST"*) echo "  [ok] yarn.lock is localized to Artifactory URLs" ;;
  *) echo "  [!!] yarn.lock is NOT showing Artifactory URLs — smudge may not have run:"; echo "       ${FIRST_RESOLVED}" ;;
esac
if git diff --quiet -- yarn.lock 2>/dev/null; then
  echo "  [ok] git status for yarn.lock is clean (won't show as modified)"
else
  echo "  [!!] git still sees yarn.lock as modified — check the clean filter"
fi

echo
echo "Done. Next step:  yarn install"
