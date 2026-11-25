// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
//
// Enforces that every PR has at least two approvals from members of
// strategic-connections-team before it can be merged, unless the PR carries the
// `sme-approval` label. The label is only honored when it was applied by a
// member of the team (and not the PR author), so authors cannot waive the
// requirement themselves. This is wired up as a required status check via
// branch protection; assignment of reviewers is handled separately by
// get-reviewers.js.
module.exports = async ({ github, context, core }) => {
    const REQUIRED_TEAM = 'strategic-connections-team'
    const REQUIRED_APPROVALS = 2
    const SME_LABEL = 'sme-approval'

    const pr = context.payload.pull_request
    if (!pr) {
        core.setFailed('No pull_request found in the event payload.')
        return
    }

    const owner = context.repo.owner
    const repo = context.repo.repo
    const pull_number = pr.number
    const prAuthor = pr.user.login

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

    // SME bypass: the label must currently be on the PR (read fresh, since the
    // event payload can be stale) and its most recent application must be by a
    // team member other than the PR author.
    const { data: issue } = await github.rest.issues.get({ owner, repo, issue_number: pull_number })
    if (issue.labels.some((label) => label.name === SME_LABEL)) {
        const events = await github.paginate(github.rest.issues.listEvents, {
            owner,
            repo,
            issue_number: pull_number,
            per_page: 100
        })
        const labeledBy = events
            .filter((event) => event.event === 'labeled' && event.label && event.label.name === SME_LABEL)
            .map((event) => event.actor && event.actor.login)
            .pop()
        if (labeledBy && labeledBy !== prAuthor && teamMembers.has(labeledBy)) {
            core.info(`'${SME_LABEL}' applied by ${REQUIRED_TEAM} member ${labeledBy}; skipping the ${REQUIRED_APPROVALS}-approval requirement.`)
            return
        }
        core.warning(
            `'${SME_LABEL}' label ignored: it must be applied by a ${REQUIRED_TEAM} member other than the PR author` +
            (labeledBy ? ` (applied by ${labeledBy}).` : '.')
        )
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

    const approvers = [...latestStateByUser.entries()]
        .filter(([login, state]) => state === 'APPROVED' && login !== prAuthor && teamMembers.has(login))
        .map(([login]) => login)

    if (approvers.length >= REQUIRED_APPROVALS) {
        core.info(`PR approved by ${approvers.length} ${REQUIRED_TEAM} member(s): ${approvers.join(', ')}`)
        return
    }

    const have = approvers.length
        ? `Currently ${approvers.length} qualifying approval(s): ${approvers.join(', ')}.`
        : 'Currently 0 qualifying approvals.'
    core.setFailed(
        `This PR requires at least ${REQUIRED_APPROVALS} approvals from @${owner}/${REQUIRED_TEAM}, ` +
        `or the '${SME_LABEL}' label applied by a team member. ${have}`
    )
}
