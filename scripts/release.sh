#!/bin/bash

branch=$1

# If no branch is provided, we get the current branch
if [[ -z $branch ]];
then
  branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);
fi;

if [[ $branch == "main" || $branch == "release" ]];
then
  echo "You must not be on the main or release branch to release"
  exit
fi;

git pull --ff-only
echo "Running lerna version minor..."

# We generate package tags on our own on main branch. So, we need don't want lerna to do it for us.
lerna version minor --allow-branch "$branch" --no-git-tag-version --no-private --yes

# We commit results of lerna version to the branch
git add .

# Add the packages published to the commit description
packages_published=$(git status -s -uno| grep "package.json" |awk '{print $2}'| xargs jq -r '.name + "@" + .version' --argjson null {})
git commit -m "Publish" -m "$packages_published"
git push origin "$branch"
