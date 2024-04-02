#!/bin/bash
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);
sha=$(git rev-parse HEAD);

if [[ $branch != "main" ]];
then
  echo "You must be on the main branch to release"
  exit
fi;

git pull --ff-only
echo "Running lerna version minor..."
lerna version prerelease --no-private --allow-branch $(git branch --show-current) --preid $(git branch --show-current) --no-push --no-git-tag-version

# Generate and add release tag
if ! n=$(git rev-list --count $sha~ --grep "Publish" --since="00:00"); then
    echo 'failed to calculate tag'
    exit 1
fi
case "$n" in
    0) suffix="" ;; # first commit of the day gets no suffix
    *) suffix=".$n" ;; # subsequent commits get a suffix, starting with .1
esac

tag=$(printf release-$(date '+%Y-%m-%d%%s') $suffix)
echo "Tagging release with $tag"
git tag -a $tag -m "Release $tag"
git push origin $tag