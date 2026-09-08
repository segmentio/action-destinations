#!/bin/sh
set -eu

echo "Checking if metadata payloads are up-to-date"

yarn generate:metadata-payload

# Check for modified tracked metadata.json files
MODIFIED=$(git diff --name-only -- 'packages/destination-actions/src/destinations/*/metadata.json' 'packages/browser-destinations/destinations/*/metadata.json' 'packages/warehouse-destinations/src/destinations/*/metadata.json')

# Check for new untracked metadata.json files
UNTRACKED=$(git ls-files --others --exclude-standard -- 'packages/destination-actions/src/destinations/*/metadata.json' 'packages/browser-destinations/destinations/*/metadata.json' 'packages/warehouse-destinations/src/destinations/*/metadata.json')

STALE="${MODIFIED}${UNTRACKED:+${MODIFIED:+
}${UNTRACKED}}"

if [ -n "$STALE" ]; then
  echo "The following metadata files are out of date or missing from the commit:"
  echo "$STALE"
  echo ""
  echo "Please run 'yarn generate:metadata-payload' and commit the result!"
  exit 1
fi

echo "Metadata payloads are up-to-date"
