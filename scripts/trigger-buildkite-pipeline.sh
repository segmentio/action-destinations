#!/bin/bash

payload=$(cat <<EOF
{  
"commit":"HEAD",
"branch":"ci-test", 
"message": ":github: Triggered from Github Actions Run: $RUN_ID",
"env":{
       "BRANCH_TO_UPDATE": "$BRANCH_NAME", 
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