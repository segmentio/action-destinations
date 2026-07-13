#!/bin/sh
# git "smudge" filter for yarn.lock (see .gitattributes + scripts/setup-yarnlock-filter.sh).
#
# Inverse of scripts/normalize-yarn-lock-registry.sh: rewrites yarn.lock's
# public registry.yarnpkg.com URLs to the local Artifactory npm proxy so
# `yarn install` can actually fetch packages on machines where the public
# registry isn't directly reachable. Yarn classic fetches from the exact
# "resolved" URL in the lockfile, so a committed public-registry URL won't get
# re-routed through a configured registry on its own.
#
# git runs this on checkout to materialize Artifactory URLs in the working tree,
# then runs the "clean" filter to normalize them back to public URLs for every
# status/diff/commit — so `git status` stays clean and commits stay public.
#
# Runs as a stream filter: reads yarn.lock content on stdin, writes the
# localized content to stdout. The target registry is recorded in local git
# config at registration time (scripts/setup-yarnlock-filter.sh); when it is
# unset — i.e. the filter was never registered, as on external contributor and
# CI machines — the content passes through unchanged.
REGISTRY=$(git config --get filter.yarnlock-registry.registry 2>/dev/null)

if [ -z "$REGISTRY" ]; then
  exec cat
fi

exec sed -E "s#https://registry\.yarnpkg\.com/#${REGISTRY}#g"
