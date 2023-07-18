#!/bin/bash
branch=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD);
if [[ $branch != "main" ]];
then
  echo "You must be on the main branch to release"
  exit
fi;


git pull --ff-only
echo "Running lerna version minor..."
lerna version minor --no-private -y
