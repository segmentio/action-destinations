#!/bin/sh
# asserts lockfile is up-to-date (https://github.com/yarnpkg/yarn/issues/5840#top).
# This can be removed when yarn is updated to a version that contains --immutable

yarn install

git diff yarn.lock
if ! git diff --exit-code yarn.lock; then
  echo "Changes were detected in yarn.lock file after running 'yarn install', which is not expected. Please run 'yarn install' locally and commit the changes."
  exit 1
fi
