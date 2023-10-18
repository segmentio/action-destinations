#!/bin/bash

# It is used by Github Actions to trigger a buildkite pipeline for updating action-destination packages.
# BUILDKITE_BRANCH is the name of the branch to trigger the pipeline for. Defaults to staging. This branch should already exist.
# BRANCH_TO_UPDATE is the branch to update the packages in. Defaults to staging. This branch will be created if it doesn't exist.

payload=$(cat <<EOF
{  
"commit":"HEAD",
"branch":"${BUILDKITE_BRANCH:-staging}", 
"message": ":github: Triggered from Github Actions Run: $RUN_ID",
"env":{
       "BRANCH_TO_UPDATE": "${BRANCH_TO_UPDATE:-staging}", 
       "ACTIONS_RELEASE": "false", 
       "CREATE_PR": "false", 
       "UPGRADE_ACTION_DESTINATIONS": "true", 
       "ACTION_DESTINATIONS_VERSION": "$ACTION_DESTINATIONS_VERSION", 
       "ACTIONS_CORE_VERSION": "$ACTIONS_CORE_VERSION"
    },
"meta_data":{}
}
EOF
)

echo "$payload"

result=$(curl --request POST \
          --url "$BUILDKITE_PIPELINE_URL" \
          --header "Authorization: Bearer $BUILDKITE_TOKEN" \
          --header 'Content-Type: application/json' \
          --data "$payload")

BUILDKITE_URL=$(echo $result | jq -r '.web_url')

if [[ "${BUILDKITE_URL}" = "null" ]]; then
    echo "Failed to trigger Buildkite pipeline. Reason:$(echo $result | jq -r '.message')"
    exit 1
else
echo "Buildkite pipeline triggered successfully."
fi