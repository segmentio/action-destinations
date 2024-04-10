#!/bin/bash

AJS_REPO="https://github.com/segmentio/analytics.js-versions.git"
CURRENT_DIR=$(pwd)
SHA="$1"
ENV="$2"

TEMP_DIR=$(mktemp -d)
git clone $AJS_REPO $TEMP_DIR

cd $TEMP_DIR

git checkout -b "action-destination-$SHA"

sed -i '' "s/\"v2actionsCanary\": \".*\"/\"v2actionsCanary\": \"$SHA\"/" "version_mappings/$ENV.json"

git add version_mappings/$ENV.json
git commit -m "Update actions canary"
git push origin head

cd $CURRENT_DIR