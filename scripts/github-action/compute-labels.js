// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
  const authorLabels = await computeAuthorLabels(github, context, core)
  const { add, remove } = await computeFileBasedLabels(github, context, core)
  core.setOutput('add', [...authorLabels, ...add].join(','))
  core.setOutput('remove', remove.join(','))
  return
}

async function computeAuthorLabels(github, context, core) {
  const teamSlugs = ['libraries-web-team', 'strategic-connections-team']
  const username = context.payload.sender.login
  const organization = context.repo.owner
  const SEGMENT_CORE_LABEL = 'team:segment-core'
  const EXTERNAL_LABEL = 'team:external'
  const SEGMENT_LABEL = 'team:segment'

  // If team member label already exists, then no need to add any labels
  const existingLabels = context.payload.pull_request.labels.map((label) => label.name)
  if (existingLabels.some((label) => [SEGMENT_CORE_LABEL, EXTERNAL_LABEL, SEGMENT_LABEL].includes(label))) {
    return []
  }

  // check against all internal teams
  const teamMembers = await Promise.all(
    teamSlugs.map(async (teamSlug) => {
      const team = await github.rest.teams.listMembersInOrg({
        team_slug: teamSlug,
        org: organization
      })
      return team.data.some((member) => member.login === username)
    })
  )

  // Add labels based on the team membership
  const labels = []
  if (teamMembers.some((member) => member === true)) {
    labels.push(SEGMENT_CORE_LABEL)
  } else {
    // check if the user is a member of the organization - eg; Engage and other internal integration devs
    await github.rest.orgs
      .checkMembershipForUser({
        org: organization,
        username: username
      })
      // if the user is not a member of the organization, then add the external label
      .catch((e) => {
        if (e.status === 404) {
          labels.push(EXTERNAL_LABEL)
        }
      })
      // if the user is a member of the organization, then add the segment label
      .then((data) => {
        if (data && data.status === 204) {
          labels.push(SEGMENT_LABEL)
        }
      })
  }
  core.debug(`Added ${labels.join(',')} labels to PR based on the author's team membership.`)
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
  const MAPPING_KIT_LABEL = 'actions:mappingkit'

  const allLabels = [
    DEPLOY_REGISTRATION_LABEL,
    DEPLOY_PUSH_LABEL,
    MODE_CLOUD_LABEL,
    MODE_DEVICE_LABEL,
    ACTIONS_CORE_LABEL,
    MAPPING_KIT_LABEL
  ]

  const newLabels = []

  // Get the list of files in the PR
  const opts = github.rest.pulls.listFiles.endpoint.merge({
    owner: org,
    repo: repo,
    pull_number: pull_number
  })

  // Paginate the list of files in the PR
  const files = await github.paginate(opts)

  // The following regexes are used to match the new destinations
  const newCloudDestinationRegex = /packages\/destination\-actions\/src\/destinations\/[^\/]+\/index\.ts/i
  const newBrowserDestinationRegex = /packages\/browser\-destinations\/destinations\/[^\/]+\/src\/index\.ts/i
  const isNew = (filename) => newCloudDestinationRegex.test(filename) || newBrowserDestinationRegex.test(filename)

  // Check if the PR contains new destinations
  const isNewDestination = files.some((file) => isNew(file.filename) && file.status === 'added')
  if (isNewDestination) {
    newLabels.push(DEPLOY_REGISTRATION_LABEL)
  }

  // The following regexes are used to match the updated destinations
  const updatedCloudDestinationRegex = /packages\/destination\-actions\/src\/destinations\/.*/i
  const updatedBrowserDestinationRegex = /packages\/browser\-destinations\/destinations\/.*/i
  const updateCorePackageRegex = /packages\/core\/.*/i
  const updatedDestinationSubscription = /packages\/destination\-subscriptions\/.*/i

  // Check if the PR contains updates to browser destinations
  if (files.some((file) => updatedBrowserDestinationRegex.test(file.filename))) {
    newLabels.push(MODE_DEVICE_LABEL)
  }

  // Check if the PR contains updates to cloud destinations
  if (files.some((file) => updatedCloudDestinationRegex.test(file.filename))) {
    newLabels.push(MODE_CLOUD_LABEL)
  }

  // Check if the PR contains updates to core packages
  if (
    files.some(
      (file) => updateCorePackageRegex.test(file.filename) || updatedDestinationSubscription.test(file.filename)
    )
  ) {
    newLabels.push(ACTIONS_CORE_LABEL)
  }

  // Check if the PR contains changes that requires a push.
  const generatedTypesRegex = /packages\/.*\/generated\-types.ts/i
  if (files.some((file) => generatedTypesRegex.test(file.filename))) {
    newLabels.push(DEPLOY_PUSH_LABEL)
  }

  // Check if PR contains changes to mapping-kit
  const mappingKitRegex = /packages\/core\/src\/mapping\-kit\/.*/i
  if (files.some((file) => mappingKitRegex.test(file.filename))) {
    newLabels.push(MAPPING_KIT_LABEL)
  }

  // Remove the existing custom labels if they are not required anymore
  const labelsToRemove = labels.filter((label) => allLabels.includes(label) && !newLabels.includes(label))

  return {
    add: newLabels,
    remove: labelsToRemove
  }
}
