#!/bin/sh
# Nuke all caches.
# Can be used in CI, or # just to get your project out of a weird state.

rm -rf node_modules/.cache .eslintcache
find . \( -name "dist" -o -iname "*.tsbuildinfo" \) ! -path "*/node_modules/*" -print0 | xargs -0 rm -rf

echo "Build files and cache deleted."
