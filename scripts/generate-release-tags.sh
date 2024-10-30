#!/bin/bash

# This script is executed after the version is bumped by lerna. It generates a release tag.
# The release tag generated will be pushed to the repository by lerna version.
set -e
sha=$(git rev-parse HEAD);
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);
message=$(git log -1 --pretty=%B);

# Only generate release tags for main branch and hotfix branches.
if [[ $branch != "main" &&  ! $branch == hotfix/* ]];
then
  echo "Skipping release tag generation as branch is not main or hotfix"
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

# If branch is hotfix, prefix should be hotfix. If not, it should be release.
if [[ $branch == hotfix/* ]];
then
  prefix="hotfix"
else
  prefix="release"
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

    tag=$(printf $prefix-$(date '+%Y-%m-%d%%s') $suffix)
    echo "Tagging $sha with $tag"
    git tag -a $tag -m "Release $tag" --force
    git push origin $tag
fi


# For hotfix, we don't tag each package version and we do it when hotfix changes are merged to main branch.
if [[ $branch == hotfix/* ]];
then
  echo "Skipping package tag generation for hotfix branch"
  exit 0
fi;

# Generate and push package tags.
curr_path=$(pwd)
dir_name=$(dirname $0)
./$dir_name/generate-package-tags.sh