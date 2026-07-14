#!/bin/sh
# git "clean" filter for yarn.lock (see .gitattributes + scripts/setup-yarnlock-filter.sh).
#
# Rewrites Artifactory-proxied npm registry URLs back to the public
# registry.yarnpkg.com. Machines configured to resolve through an Artifactory
# npm proxy (any host, any repo-key) end up with
# https://<host>/artifactory/api/npm/<repo-key>/... resolved URLs in their
# working-tree yarn.lock; those must never be committed, so git runs this filter
# on `git add` (and on every status/diff) to produce the canonical public URLs
# that external contributors and CI use.
#
# Runs as a stream filter: reads yarn.lock content on stdin, writes the
# normalized content to stdout. Machines with no Artifactory URLs (external
# contributors, CI) pass through unchanged.
exec sed -E 's#https://[A-Za-z0-9.-]+/artifactory/api/npm/[A-Za-z0-9_.-]+/#https://registry.yarnpkg.com/#g'
