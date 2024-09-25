#!/bin/bash
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);

if [[ $branch != "main" && $branch != "release" ]];
then
  echo "You must be on the main or relesase branch to release"
  exit
fi;

git pull --ff-only
echo "Running lerna version minor..."
lerna version minor --no-private -y
