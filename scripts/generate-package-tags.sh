
#!/bin/bash

set -e # exit on error

# this script assumes the last commit was publish commit and gets all package.json files changed in the last commit
# and generates tags for each package.json file.
files=$(git show --pretty="" --name-only HEAD | grep -Ei '^packages/.*package\.json$')
for file in $files; do
  tag=$(cat $file | jq -r '.name + "@" + .version')
  echo "Tagging $sha with $tag"
  git tag -a $tag -m "Release $tag" --force
  git push origin $tag
done