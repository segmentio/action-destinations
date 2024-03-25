module.exports = async ({ github, context, core, exec }) => {
  const { GITHUB_SHA, RELEASE_TAG } = process.env
  const { data } = await github.rest.search.commits({
    q: `Publish repo:${context.repo.owner}/${context.repo.repo}`,
    per_page: 2,
    sort: 'committer-date'
  })

  if (data.items.length < 2) {
    core.error(`No previous release commits found`)
  }

  const newPublish = data.items[0]
  const previousPublish = data.items[1]
  const prs = await getPRsBetweenCommits(github, context, core, previousPublish, newPublish)

  const newReleaseTag = RELEASE_TAG

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

  const packageTags = await extractPackageTags(GITHUB_SHA, exec, core)
  const tagsContext = { currentRelease: newReleaseTag, prevRelease: latestReleaseTag, packageTags }
  const changeLog = formatChangeLog(prs, tagsContext, context)

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

async function extractPackageTags(sha, exec, core) {
  const { stdout, stderr, exitCode } = await exec.getExecOutput('git', ['tag', '--points-at', sha])
  if (exitCode !== 0) {
    core.error(`Failed to extract package tags: ${stderr}`)
  }
  return stdout.split('\n').filter(Boolean)
}

async function getPRsBetweenCommits(github, context, core, lastCommit, currentCommit) {
  const lastCommitDate = new Date(lastCommit.commit.committer.date)
  const currentCommitDate = new Date(currentCommit.commit.committer.date)
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

function formatChangeLog(prs, tagsContext, context) {
  const { currentRelease, prevRelease, packageTags } = tagsContext
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

  // if there is no previous release, we simply print the current release
  const releaseDiff = prevRelease ? `${prevRelease}...${currentRelease}` : currentRelease

  const formattedPackageTags = packageTags
    .filter((tag) => tag.includes('@segment/'))
    .map((tag) => `- [${tag}](https://www.npmjs.com/package/${formatNPMPackageURL(tag)})`)
    .join('\n')

  const changelog = `
    # What's New
    
    https://github.com/${context.repo.owner}/${context.repo.repo}/compare/${releaseDiff}

    ## Packages Published

    ${formattedPackageTags || 'No packages published'}

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
