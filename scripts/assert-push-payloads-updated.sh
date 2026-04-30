#!/bin/sh

echo "Checking if push-payloads are up-to-date"

yarn push-payloads

if [ -n "$(git status --porcelain -- '**/payload.json')" ]; then
  echo "Push payload files are out of date. Please run 'yarn push-payloads' and commit the result!"
  exit 1
fi

echo "Push payloads are up-to-date"
