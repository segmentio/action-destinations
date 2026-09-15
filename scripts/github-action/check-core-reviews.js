// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
//
// Enforces that any PR touching actions-core (packages/core or
// packages/destination-subscriptions) has at least two approvals from members
// of strategic-connections-team before it can be merged. This is wired up as a
// required status check via branch protection; assignment of reviewers is
// handled separately by get-reviewers.js.
module.exports = async ({ github, context, core }) => {
    const REQUIRED_TEAM = 'strategic-connections-team'
    const REQUIRED_APPROVALS = 2

    // Paths that constitute an actions-core change. Kept in sync with the
    // actions:core label logic in compute-labels.js.
    const coreRegexes = [/^packages\/core\//i, /^packages\/destination-subscriptions\//i]

    const pr = context.payload.pull_request
    if (!pr) {
        core.setFailed('No pull_request found in the event payload.')
        return
    }

    const owner = context.repo.owner
    const repo = context.repo.repo
    const pull_number = pr.number

    // Determine whether this PR modifies actions-core.
    const files = await github.paginate(github.rest.pulls.listFiles, {
        owner,
        repo,
        pull_number,
        per_page: 100
    })
    const isCoreChange = files.some((file) => coreRegexes.some((re) => re.test(file.filename)))

    if (!isCoreChange) {
        core.info('PR does not modify actions-core; no additional review requirement applies.')
        return
    }

    // Fetch the members of the required team.
    let teamMembers
    try {
        const members = await github.paginate(github.rest.teams.listMembersInOrg, {
            org: owner,
            team_slug: REQUIRED_TEAM,
            per_page: 100
        })
        teamMembers = new Set(members.map((member) => member.login))
    } catch (error) {
        core.setFailed(`Failed to load ${REQUIRED_TEAM} members: ${error.message}`)
        return
    }

    // Compute the latest decisive review state per reviewer. COMMENTED / PENDING
    // reviews are ignored so that commenting after approving does not drop the
    // approval, mirroring GitHub's own behavior.
    const reviews = await github.paginate(github.rest.pulls.listReviews, {
        owner,
        repo,
        pull_number,
        per_page: 100
    })

    const latestStateByUser = new Map()
    for (const review of reviews) {
        if (!review.user) continue
        if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) continue
        latestStateByUser.set(review.user.login, review.state)
    }

    const prAuthor = pr.user.login
    const approvers = [...latestStateByUser.entries()]
        .filter(([login, state]) => state === 'APPROVED' && login !== prAuthor && teamMembers.has(login))
        .map(([login]) => login)

    if (approvers.length >= REQUIRED_APPROVALS) {
        core.info(
            `actions-core change approved by ${approvers.length} ${REQUIRED_TEAM} member(s): ${approvers.join(', ')}`
        )
        return
    }

    const have = approvers.length
        ? `Currently ${approvers.length} qualifying approval(s): ${approvers.join(', ')}.`
        : 'Currently 0 qualifying approvals.'
    core.setFailed(
        `This PR modifies actions-core and requires at least ${REQUIRED_APPROVALS} approvals from ` +
        `@${owner}/${REQUIRED_TEAM}. ${have}`
    )
}
