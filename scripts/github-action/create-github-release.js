// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core, exec, cloudManifest, browserManifest }) => {
  let { GITHUB_SHA, DRY_RUN, GITHUB_REF } = process.env

  // Get the branch name from the GITHUB_REF
  const branchName = GITHUB_REF.replace('refs/heads/', '')
  const isHotfixBranch = branchName.startsWith('hotfix/')

  if (Boolean(DRY_RUN)) {
    core.info('Running in dry-run mode')
  }

  let prs = []
  // Retrieve PRs merged between the last two publish commits only for normal releases
  if (!isHotfixBranch) {
    // Get the last two commits that have the word "Publish" in the commit message along with the date
    const [newPublish, previousPublish] = await getPreviousTwoPublishCommits(core, exec)
    prs = await getPRsBetweenCommits(github, context, core, previousPublish, newPublish)
  }

  // Get tag for the current release from the git repository
  const newReleaseTag = await getReleaseTag(core, exec)

  // Fetch the latest github release
  const latestRelease = await github.rest.repos
    .getLatestRelease({
      owner: context.repo.owner,
      repo: context.repo.repo
    })
    .catch((e) => {
      core.info(`No previous release found: ${e.message}`)
      return null
    })

  const latestReleaseTag = latestRelease ? latestRelease.data.tag_name : null

  // Extract package tags that are published in the current release by lerna version
  const packageTags = await extractPackageNames(GITHUB_SHA, exec, core)
  const tagsContext = { currentRelease: newReleaseTag, prevRelease: latestReleaseTag, packageTags }
  const cloudDestinationsByDirectory = Object.values(cloudManifest).reduce((acc, destination) => {
    acc[destination.directory] = destination
    return acc
  }, {})
  const browserDestinationsByDirectory = Object.values(browserManifest).reduce((acc, destination) => {
    acc[destination.directory] = destination
    return acc
  }, {})
  const changeLog = formatChangeLog(
    prs,
    tagsContext,
    context,
    cloudDestinationsByDirectory,
    browserDestinationsByDirectory
  )

  // If DRY_RUN is set, then log the changelog and return
  if (Boolean(DRY_RUN)) {
    core.info(`DRY_RUN: Release ${newReleaseTag} will be created with the following changelog: \n${changeLog}`)
    return
  }

  // Create a new release
  await github.rest.repos
    .createRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag_name: newReleaseTag,
      name: newReleaseTag,
      body: changeLog
    })
    .then(() => {
      core.info(`Release ${newReleaseTag} created successfully`)
    })
    .catch((e) => {
      core.error(`Failed to create release: ${e.message}`)
    })
  return
}

// Get the last two commits that have the word "Publish" in the commit message along with the date
async function getPreviousTwoPublishCommits(core, exec) {
  const { stdout, stderr, exitCode } = await exec.getExecOutput('git', [
    'log',
    '--grep=Publish',
    '-n',
    `2`,
    '--format="%H|%ai"'
  ])

  if (exitCode !== 0) {
    // if the publish commits are not found, then we cannot proceed further
    core.error(`Failed to extract package tags: ${stderr}`)
  }
  return stdout.split('\n').map((commit) => {
    const [sha, date] = commit.split('|')
    return { sha, date }
  })
}

// Get the latest release tag
async function getReleaseTag(core, exec) {
  const { stdout, stderr, exitCode } = await exec.getExecOutput('git', [
    'describe',
    '--abbrev=0',
    '--tags',
    '--match=release-*',
    '--match=hotfix-*'
  ])
  if (exitCode !== 0) {
    // if the release tag is not found, then we cannot proceed further
    core.error(`Failed to get release tag. Unable to proceed further: ${stderr}`)
  }
  return stdout.trim()
}

// Extract packages published in the current release
async function extractPackageNames(sha, exec, core) {
  const { stdout, stderr, exitCode } = await exec.getExecOutput('git', [
    'diff-tree',
    '--no-commit-id',
    '--name-only',
    sha,
    '-r'
  ])
  if (exitCode !== 0) {
    // if the package tags are not found, then we cannot proceed further
    core.error(`Failed to extract package tags: ${stderr}`)
  }
  // filter out files that are not package.json
  const files = stdout.split('\n').filter((file) => file.startsWith('packages/') && file.endsWith('package.json'))
  // get the package versions and names from package.json files
  const packageTags = await Promise.all(
    files.map(async (file) => {
      const { stdout, stderr, exitCode } = await exec.getExecOutput('cat', [file])
      if (exitCode !== 0) {
        core.error(`Failed to extract package tags: ${stderr}`)
      }
      const pkg = JSON.parse(stdout)
      return `${pkg.name}@${pkg.version}`
    })
  )
  return packageTags
}

// Get PRs between two commits
async function getPRsBetweenCommits(github, context, core, lastCommit, currentCommit) {
  const lastCommitDate = new Date(lastCommit.date)
  const currentCommitDate = new Date(currentCommit.date)
  const owner = context.repo.owner
  const repo = context.repo.repo
  // GraphQL query to get PRs between two commits. Assumption is the PR might not have more than 100 files and 10 labels.
  // If the PR has more than 100 files or 10 labels, we might need to paginate the query.
  try {
    const prsMerged = await github.graphql(`{
    search(first:100, type: ISSUE, query: "repo:${owner}/${repo} is:pr merged:${lastCommitDate.toISOString()}..${currentCommitDate.toISOString()}") {
      issueCount
      nodes {
        ... on PullRequest {
          number
          title
          url
          author {
            login
          }
          files(first: 100) {
            nodes {
              path
            }
          }
          labels(first: 10, orderBy: {direction: DESC, field: CREATED_AT}) {
            nodes {
              name
            }
          }
        }
      }
    }
     }`)

    core.info(`Found ${prsMerged.search.issueCount} PRs between commits`)

    return prsMerged.search.nodes.map((pr) => ({
      number: `[#${pr.number}](${pr.url})`,
      // escape the pipe character in the title to avoid table formatting issues
      title: pr.title.replace('|', '\\|'),
      url: pr.url,
      files: pr.files.nodes.map((file) => file.path),
      author: `@${pr.author.login}`,
      labels: pr.labels.nodes.map((label) => label.name),
      requiresPush: pr.labels.nodes.some((label) => label.name === 'deploy:push') ? 'Yes' : 'No',
      requiresRegistration: pr.labels.nodes.some((label) => label.name === 'deploy:registration') ? 'Yes' : 'No'
    }))
  } catch (e) {
    // if the PRs are not found, then we cannot proceed further
    core.error(`Unable to fetch PRs between commits: ${e.message}`)
  }
}

// Format the changelog
function formatChangeLog(prs, tagsContext, context, cloudDestinationsByDir, browserDestinationsByDir) {
  const { currentRelease, prevRelease, packageTags } = tagsContext
  const prsWithAffectedDestinations = prs.map((pr) =>
    mapPRWithAffectedDestinations(pr, cloudDestinationsByDir, browserDestinationsByDir)
  )
  const internalPRS = prsWithAffectedDestinations.filter(
    (pr) => pr.labels.includes('team:segment-core') || pr.labels.includes('team:segment')
  )
  const externalPRs = prsWithAffectedDestinations.filter((pr) => pr.labels.includes('team:external'))

  const tableConfig = [
    {
      label: 'PR',
      value: 'number'
    },
    {
      label: 'Title',
      value: 'title'
    },
    {
      label: 'Author',
      value: 'author'
    },
    {
      label: 'Affected Destinations',
      value: 'affectedDestinations'
    },
    {
      label: 'Requires Push',
      value: 'requiresPush'
    },
    {
      label: 'Requires Registration',
      value: 'requiresRegistration'
    }
  ]

  // construct a set of unique affected slugs
  const uniqueAffectedSlugs = new Set(prsWithAffectedDestinations.map((pr) => pr.affectedSlugs).flat())

  // if there is no previous release, we simply print the current release
  const releaseDiff = prevRelease ? `${prevRelease}...${currentRelease}` : currentRelease

  const formattedPackageTags = packageTags.map((tag) => `- ${formatNPMPackageURL(tag)}`).join('\n')

  const changelog = `
    # What's New

    https://github.com/${context.repo.owner}/${context.repo.repo}/compare/${releaseDiff}

    <!-- DON'T DELETE THIS COMMENT
    <affected-destinations>
        ${Array.from(uniqueAffectedSlugs)
          .map((slug) => `${slug}`)
          .join('\n')}
    </affected-destinations>
    -->

    ## Packages Published

    ${formattedPackageTags || 'No packages published'}

    ${internalPRS.length > 0 ? formatTable(internalPRS, tableConfig, '## Internal PRs') : ''}

    ${externalPRs.length > 0 ? formatTable(externalPRs, tableConfig, '## External PRs') : ''}
    `
  // trim double spaces and return the changelog
  return changelog.replace(/  +/g, '')
}

// Format the PRs in a table
function formatTable(prs, tableConfig, title = '') {
  return `
    ${title}

    |${tableConfig.map((config) => config.label).join('|')}|
    |${tableConfig.map(() => '---').join('|')}|
    ${prs.map((pr) => `|${tableConfig.map((config) => pr[config.value]).join('|')}|`).join('\n')}
    `
}
/*
 * Map PR with affected destinations
 */
function mapPRWithAffectedDestinations(pr, cloudDestinationsByDirectory, browserDestinationsByDirectory) {
  let affectedDestinations = []
  let affectedSlugs = []
  if (pr.labels.includes('mode:cloud')) {
    pr.files
      .filter((file) => file.includes('packages/destination-actions/src/destinations'))
      .forEach((file) => {
        const match = file.match(/packages\/destination-actions\/src\/destinations\/([^\/]+)\/*/)
        if (match && !affectedDestinations.includes(match[1])) {
          affectedDestinations.push(match[1])
          // get the slug from the directory
          if (cloudDestinationsByDirectory[match[1]]) {
            affectedSlugs.push(cloudDestinationsByDirectory[match[1]].definition.slug)
          }
        }
      })
  }
  if (pr.labels.includes('mode:device')) {
    pr.files
      .filter((file) => file.includes('packages/browser-destinations/destinations'))
      .forEach((file) => {
        const match = file.match(/packages\/browser-destinations\/destinations\/([^\/]+)\/*/)
        if (match && !affectedDestinations.includes(match[1])) {
          affectedDestinations.push(match[1])
          // get the slug from the directory
          if (browserDestinationsByDirectory[match[1]]) {
            affectedSlugs.push(browserDestinationsByDirectory[match[1]].definition.slug)
          }
        }
      })
  }
  return {
    ...pr,
    affectedDestinations: affectedDestinations.join(', '),
    affectedSlugs: affectedSlugs
  }
}

// Format the npm package URL
function formatNPMPackageURL(tag) {
  const [name, version] = tag.split(/@(\d.*)/)
  return `[${tag}](https://www.npmjs.com/package/${name}/v/${version})`
}
