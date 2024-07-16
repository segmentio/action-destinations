#!/bin/bash

# This script is executed after the version is bumped by lerna. It generates a release tag.
# The release tag generated will be pushed to the repository by lerna version.
set -e
sha=$(git rev-parse HEAD);
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);
message=$(git log -1 --pretty=%B);

if [[ $branch != "main" && $branch != "release" ]];
then
  echo "Skipping release tag generation as branch is not main or release"
  exit 0
fi;

if [[ $message != *"Publish"* ]];
then
  echo "Skipping release tag generation as last commit is not a publish commit"
  exit 0
fi;

# check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found. Please install jq to generate release tag."
    exit 1
fi

# Generate and push release tag. Release tag format: release-YYYY-MM-DD[.N] e.g. release-2024-01-01
if ! n=$(git rev-list --count $sha~ --grep "Publish" --since="00:00"); then
    echo 'Failed to compute release tag. Exiting.'
    exit 1
else
    case "$n" in
        0) suffix="" ;; # first commit of the day gets no suffix
        *) suffix=".$n" ;; # subsequent commits get a suffix, starting with .1
    esac

    tag=$(printf release-$(date '+%Y-%m-%d%%s') $suffix)
    echo "Tagging $sha with $tag"
    git tag -a $tag -m "Release $tag" --force
    git push origin $tag
fi

# this script assumes the last commit was publish commit and gets all package.json files changed in the last commit
# and generates tags for each package.json file.
files=$(git show --pretty="" --name-only HEAD | grep -Ei '^packages/.*package\.json$')
for file in $files; do
  tag=$(cat $file | jq -r '.name + "@" + .version')
  echo "Tagging $sha with $tag"
  git tag -a $tag -m "Release $tag" --force
  git push origin $tag
done
