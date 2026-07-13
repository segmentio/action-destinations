#!/bin/sh
# Rewrites Artifactory-proxied npm registry URLs in yarn.lock back to the
# public registry.yarnpkg.com. Local machines configured to resolve through an
# Artifactory npm proxy (any host, any repo-key) end up with
# https://<host>/artifactory/api/npm/<repo-key>/... resolved URLs instead of
# https://registry.yarnpkg.com/..., which shouldn't be committed.
set -e

if [ ! -f yarn.lock ]; then
  exit 0
fi

sed -i.bak -E 's#https://[A-Za-z0-9.-]+/artifactory/api/npm/[A-Za-z0-9_.-]+/#https://registry.yarnpkg.com/#g' yarn.lock
rm -f yarn.lock.bak
