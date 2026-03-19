#!/bin/sh

echo "Checking if generated types are up-to-date"

pnpm types

if [ -n "$(git status --porcelain | grep generated-types.ts)" ]; then
  echo "Please run 'pnpm types' and commit the result!"
  exit 1
fi

echo "Generated types are up-to-date"
