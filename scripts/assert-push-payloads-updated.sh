#!/bin/sh

echo "Checking if push-payloads are up-to-date"

yarn push-payloads

STALE=$(git status --porcelain -- 'packages/destination-actions/src/destinations/*/payload.json' 'packages/browser-destinations/destinations/*/payload.json')

if [ -n "$STALE" ]; then
  echo "The following payload files are out of date:"
  echo "$STALE"
  echo ""
  echo "Please run 'yarn push-payloads' and commit the result!"
  exit 1
fi

echo "Push payloads are up-to-date"
