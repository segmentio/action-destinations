#!/bin/sh

echo "Checking if generated types are up-to-date"

yarn types

if [ -n "$(git status --porcelain | grep generated-types.ts)" ]; then
  echo "Please run 'yarn types' and commit the result!"
  exit 1
fi

echo "Generated types are up-to-date"
