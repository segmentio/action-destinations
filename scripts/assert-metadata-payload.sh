#!/bin/sh
set -eu

echo "Checking if metadata payloads are up-to-date"

yarn generate:metadata-payload

# Only check already-tracked metadata.json files for modifications (ignore untracked)
STALE=$(git diff --name-only -- 'packages/destination-actions/src/destinations/*/metadata.json' 'packages/browser-destinations/destinations/*/metadata.json' 'packages/warehouse-destinations/src/destinations/*/metadata.json')

if [ -n "$STALE" ]; then
  echo "The following metadata files are out of date:"
  echo "$STALE"
  echo ""
  echo "Please run 'yarn generate:metadata-payload' and commit the result!"
  exit 1
fi

echo "Metadata payloads are up-to-date"
