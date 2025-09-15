#!/bin/bash

set -e

branch=$(git branch --show-current)
echo "Publishing canary release for branch: \"$branch\"."
npx lerna publish --canary --preid "$branch" --include-merged-tags
