#!/bin/bash
set -e # exit with nonzero exit code if anything fails
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);
sha=$(git rev-parse HEAD);

if [[ $branch != "main" ]];
then
  echo "You must be on the main branch to release"
  exit
fi;

# Generate and push release tag. Release tag format: release-YYYY-MM-DD[.N] e.g. release-2024-01-01
if ! n=$(git rev-list --count $sha~ --grep "Publish" --since="00:00"); then
    echo 'Failed to find compute release tag. Please manually tag the release with git tag -a release-YYYY-MM-DD -m "Release release-YYYY-MM-DD" and push the tag with git push origin release-YYYY-MM-DD'
else 
    case "$n" in
        0) suffix="" ;; # first commit of the day gets no suffix
        *) suffix=".$n" ;; # subsequent commits get a suffix, starting with .1
    esac

    tag=$(printf release-$(date '+%Y-%m-%d%%s') $suffix)
    echo "Tagging $sha with $tag"
    git tag -a $tag -m "Release $tag"
fi

git pull --ff-only
echo "Running lerna version minor..."
lerna version minor --no-private -y