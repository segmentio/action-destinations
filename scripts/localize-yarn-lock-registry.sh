#!/bin/sh
# Inverse of scripts/normalize-yarn-lock-registry.sh: rewrites yarn.lock's
# public registry.yarnpkg.com URLs to the local npm registry (if one is
# configured via $npm_config_registry, e.g. an internal Artifactory proxy),
# so `yarn install` can actually fetch packages on machines where the public
# registry isn't directly reachable. Yarn classic fetches from the exact
# "resolved" URL already in the lockfile, so a committed public-registry URL
# won't get re-routed through a configured registry on its own.
#
# This is a local, uncommitted convenience rewrite only — the committed
# yarn.lock always points at registry.yarnpkg.com; normalize-yarn-lock-registry.sh
# rewrites it back before every commit.
set -e

if [ ! -f yarn.lock ]; then
  exit 0
fi

if [ -z "$npm_config_registry" ]; then
  exit 0
fi

REGISTRY=$(echo "$npm_config_registry" | sed -E 's#/+$##')/

sed -i.bak -E "s#https://registry\.yarnpkg\.com/#${REGISTRY}#g" yarn.lock
rm -f yarn.lock.bak
