# Testing Github Action Scripts

[Label PRs](../../.github/workflows/label-prs.yml) and [Publish](../../.github/workflows/publish.yml) workflow use [compute-labels.js](compute-labels.js) and [create-github-release.js](create-github.release.js) scripts.

[act](https://github.com/nektos/act) is a tool to test github workflows. Follow [installation instructions](https://nektosact.com/installation/index.html) for setting up `act`.

## Testing compute-labels script

This script computes PR Labels based on the packages changed in the PR and the author.
To test this script with `Label PRs` workflow, you'll need a GITHUB PAT token with permissions to read-write PRs and read memembers of Organization. Edit the [pr-event.json](pr-event.json) according the scenario you want to test. 

**Note:** When DRY_RUN is set to true, the workflow won't update the PR but instead just print the labels to be added or removed.

Run the following command to test the compute-labels script.
```bash
act -W '.github/workflows/label-prs.yml' -e scripts/github-action/pr-event.json --env DRY_RUN=true -s GH_PAT_MEMBER_AND_PULL_REQUEST_READONLY=<PAT> -s GITHUB_TOKEN=<PAT> --container-architecture linux/amd64
```

## Testing create-github-release script

The `release` job uses `create-github-release` script to compute changelog and creates a release. This job has dependency on `build-and-publish` job to finish publishing lerna packages. To test this job in local, comment on the [needs](https://github.com/segmentio/action-destinations/blob/6f55e6f051c214754f9fb9b213ddad6764ba3f18/.github/workflows/publish.yml#L61) attribute to skip `build-and-publish` job and run just the release command. You will need a Github PAT token with permissions to create release. 

**Note:** When DRY_RUN is set to true, the `create-github-release` doesn't create a release and instead just prints the changelog.

Run the following command to test the create-github-release script.
```bash
act --env DRY_RUN=true -s GITHUB_TOKEN=<PAT_TOKEN> -j "release"  --container-architecture linux/amd64
```
