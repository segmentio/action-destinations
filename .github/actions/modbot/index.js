const github = require('@actions/github')
const core = require('@actions/core')

// const { GITHUB_TOKEN } = process.env

const REPO_OWNER = 'segmentio'
const REPO_NAME = 'action-destinations'
const PR_WARNING_LABEL = 'warning:tests-deleted'

const octokit = github.getOctokit(
  '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'
)

async function run() {
  const { number, pull_request } = github.context.payload
  core.debug('PR:', JSON.stringify(github.context))

  //   core.debug('PR number:', number)
  // No need to check if the warning has been applied.
  if (pull_request.labels.includes(PR_WARNING_LABEL)) {
    return
  }

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: number
  })

  for (const file of files) {
    core.debug(file.filename)
  }
}

try {
  run()
} catch (err) {
  core.fail(err)
}
