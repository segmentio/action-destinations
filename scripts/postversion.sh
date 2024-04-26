#!/bin/bash

# This script is executed after the version is bumped by lerna. It generates a release tag.
# The release tag generated will be pushed to the repository by lerna version.
set -e
sha=$(git rev-parse HEAD);
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);

if [[ $branch != "main" && $branch != "release" ]];
then
  echo "Skipping release tag generation as branch is not main or release"
  exit 0
fi;

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
    git tag -a $tag -m "Release $tag"
fi
