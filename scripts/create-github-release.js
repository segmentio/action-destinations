// This is a github action script and can be run only from github actions. It is not possible to run this script locally.
module.exports = async ({ github, context, core, exec }) => {
  const { GITHUB_SHA, RELEASE_TAG } = process.env
  const { data } = await github.rest.search.commits({
    q: `Publish repo:${context.repo.owner}/action-destinations`,
    per_page: 2,
    sort: 'committer-date'
  })
  if (data.items.length < 2) {
    core.error(`No previous release commits found`)
  }
  const currentCommit = data.items[0]
  const lastCommit = data.items[1]
  const prs = await getPRsBetweenCommits(github, context, core, lastCommit, currentCommit)

  const currentReleaseTag = RELEASE_TAG
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
  const packageTags = await extractPackageTags(GITHUB_SHA, exec, core)
  const changeLog = formatChangeLog(prs, currentReleaseTag, latestReleaseTag, packageTags)

  await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: currentReleaseTag,
    name: currentReleaseTag,
    body: changeLog
  })

  return
}

// Extracts the package tags from the commit SHA
async function extractPackageTags(sha, exec, core) {
  const { stdout, stderr, exitCode } = await exec.getExecOutput('git', ['tag', '--points-at', sha])
  if (exitCode !== 0) {
    core.error(`Failed to extract package tags: ${stderr}`)
  }
  return stdout.split('\n').filter(Boolean)
}

// Fetches the PRs between two commits
async function getPRsBetweenCommits(github, context, core, lastCommit, currentCommit) {
  const lastCommitDate = new Date(lastCommit.commit.committer.date)
  const currentCommitDate = new Date(currentCommit.commit.committer.date)
  // GraphQL query to get PRs between two commits
  try {
    const prsMerged = await github.graphql(`{
      search(first:100, type: ISSUE, query: "repo:segmentio/action-destinations is:pr merged:${lastCommitDate.toISOString()}..${currentCommitDate.toISOString()}") {
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
      title: pr.title,
      url: pr.url,
      files: pr.files.nodes.map((file) => file.path),
      author: `@${pr.author.login}`,
      labels: pr.labels.nodes.map((label) => label.name),
      requiresPush: pr.labels.nodes.some((label) => label.name === 'deploy:push') ? 'Yes' : 'No',
      requiresRegistration: pr.labels.nodes.some((label) => label.name === 'deploy:registration') ? 'Yes' : 'No'
    }))
  } catch (e) {
    core.error(`Unable to fetch PRs between commits: ${e.message}`)
  }
}

// Formats the changelog
function formatChangeLog(prs, currentRelease, prevRelease, packageTags) {
  const prsWithAffectedDestinations = prs.map(mapPRWithAffectedDestinations)
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

  const packageURLs = packageTags
    .filter((tag) => tag.includes('@segment/'))
    .map((tag) => `- ${formatNPMPackageURL(tag)}`)
    .join('\n')

  const changelog = `
      # What's Changed
      
      [Commits](https://github.com/segmentio/action-destinations-deploy-automation/compare/${prevRelease}...${currentRelease})
  
      ## Packages Published
  
      ${packageURLs}
  
      ## Internal PRs
      
      |${tableConfig.map((config) => config.label).join('|')}|
      |${tableConfig.map(() => '---').join('|')}|
      ${internalPRS
        .map((pr) => {
          return `|${tableConfig.map((config) => pr[config.value]).join('|')}|`
        })
        .join('\n')}
          
      ## External PRs
      
      |${tableConfig.map((config) => config.label).join('|')}|
      |${tableConfig.map(() => '---').join('|')}|
      ${externalPRs
        .map((pr) => {
          return `|${tableConfig.map((config) => pr[config.value]).join('|')}|`
        })
        .join('\n')}
      `.replace(/  +/g, '')
  return changelog
}

function mapPRWithAffectedDestinations(pr) {
  let affectedDestinations = []
  if (pr.labels.includes('mode:cloud')) {
    pr.files
      .filter((file) => file.includes('packages/destination-actions/src/destinations'))
      .forEach((file) => {
        const match = file.match(/packages\/destination-actions\/src\/destinations\/([^\/]+)\/*/)
        if (match && !affectedDestinations.includes(match[1])) {
          affectedDestinations.push(match[1])
        }
      })
  }
  if (pr.labels.includes('mode:device')) {
    pr.files
      .filter((file) => file.includes('packages/browser-destinations/destinations'))
      .forEach((file) => {
        const match = file.match(/packages\/browser-destinations\/([^\/]+)\/*/)
        if (match && !affectedDestinations.includes(match[1])) {
          affectedDestinations.push(match[1])
        }
      })
  }
  return {
    ...pr,
    affectedDestinations: affectedDestinations.join(', ')
  }
}

function formatNPMPackageURL(tag) {
  const [name, version] = tag.split(/@(\d.*)/)
  return `[${tag}](https://www.npmjs.com/package/${name}/v/${version})`
}
