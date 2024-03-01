// This is a github action script and can be run only from github actions. It is not possible to run this script locally.
module.exports = async ({ github, context, core }) => {
  const authorLabels = await computeAuthorLabels(github, context, core)
  const { add, remove } = await computeFileBasedLabels(github, context, core)
  core.setOutput('add', [...authorLabels, ...add].join(','))
  core.setOutput('remove', remove.join(','))
  return
}

async function computeAuthorLabels(github, context, core) {
  const teamSlugs = ['build-experience-team', 'libraries-web-team', 'strategic-connections-team']
  const username = context.payload.sender.login
  const organization = context.repo.owner
  const SEGMENT_CORE_LABEL = 'team:segment-core'
  const EXTERNAL_LABEL = 'team:external'
  const SEGMENT_LABEL = 'team:segment'

  const existingLabels = context.payload.pull_request.labels.map((label) => label.name)
  if (existingLabels.some((label) => [SEGMENT_CORE_LABEL, EXTERNAL_LABEL, SEGMENT_LABEL].includes(label))) {
    core.debug(`Not adding labels to PR as team labels already exist on the PR.`)
    return []
  }

  const teamMembers = await Promise.all(
    teamSlugs.map(async (teamSlug) => {
      const team = await github.rest.teams.listMembersInOrg({
        team_slug: teamSlug,
        org: organization
      })
      return team.data.some((member) => member.login === username)
    })
  )

  const labels = []
  if (teamMembers.some((member) => member === true)) {
    labels.push(SEGMENT_CORE_LABEL)
  } else {
    const res = await github.rest.orgs
      .checkMembershipForUser({
        org: organization,
        username: username
      })
      .catch((e) => {
        if (e.status === 404) {
          labels.push(EXTERNAL_LABEL)
        }
      })
    if (res) {
      labels.push(SEGMENT_LABEL)
    }
  }

  core.debug(`Added Labels to PR: ${labels.join(',')}`)
  return labels
}

async function computeFileBasedLabels(github, context, core) {
  const org = context.repo.owner
  const repo = context.repo.repo
  const pull_number = context.payload.pull_request.number
  const labels = context.payload.pull_request.labels.map((label) => label.name)
  const DEPLOY_REGISTRATION_LABEL = 'deploy:registration'
  const DEPLOY_PUSH_LABEL = 'deploy:push'
  const MODE_CLOUD_LABEL = 'mode:cloud'
  const MODE_DEVICE_LABEL = 'mode:device'
  const ACTIONS_CORE_LABEL = 'actions:core'

  const allLabels = [
    DEPLOY_REGISTRATION_LABEL,
    DEPLOY_PUSH_LABEL,
    MODE_CLOUD_LABEL,
    MODE_DEVICE_LABEL,
    ACTIONS_CORE_LABEL
  ]

  const newLabels = []
  const opts = github.rest.pulls.listFiles.endpoint.merge({
    owner: org,
    repo: repo,
    pull_number: pull_number
  })

  const files = await github.paginate(opts)

  // The following regexes are used to match the new destinations
  const newCloudDestinationRegex = /packages\/destination\-actions\/src\/destinations\/.*\/index\.ts/i
  const newBrowserDestinationRegex = /packages\/browser\-destinations\/destinations\/.*\/src\/index\.ts/i
  const isNew = (filename) => newCloudDestinationRegex.test(filename) || newBrowserDestinationRegex.test(filename)

  const isNewDestination = files.some((file) => isNew(file.filename) && file.status === 'added')
  if (isNewDestination) {
    newLabels.push(DEPLOY_REGISTRATION_LABEL)
  }

  // The following regexes are used to match the updated destinations
  const updatedCloudDestinationRegex = /packages\/destination\-actions\/src\/destinations\/.*/i
  const updatedBrowserDestinationRegex = /packages\/browser\-destinations\/destinations\/.*/i
  const updateCorePackageRegex = /packages\/core\/.*/i
  const updatedDestinationSubscription = /packages\/destination\-subscriptions\/.*/i

  if (files.some((file) => updatedBrowserDestinationRegex.test(file.filename))) {
    newLabels.push(MODE_DEVICE_LABEL)
  }

  if (files.some((file) => updatedCloudDestinationRegex.test(file.filename))) {
    newLabels.push(MODE_CLOUD_LABEL)
  }

  if (
    files.some(
      (file) => updateCorePackageRegex.test(file.filename) || updatedDestinationSubscription.test(file.filename)
    )
  ) {
    newLabels.push(ACTIONS_CORE_LABEL)
  }

  const generatedTypesRegex = /packages\/.*\/generated\-types.ts/i
  if (files.some((file) => generatedTypesRegex.test(file.filename))) {
    newLabels.push(DEPLOY_PUSH_LABEL)
  }

  // Remove the existing custom labels if they are not required anymore
  const labelsToRemove = labels.filter((label) => allLabels.includes(label) && !newLabels.includes(label))
  core.debug(`Labels to remove: ${labelsToRemove.join(',')}`)
  return {
    add: newLabels,
    remove: labelsToRemove
  }
}
