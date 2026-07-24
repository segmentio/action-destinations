// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const { labelsToAdd } = process.env

    // The team that owns actions-core (packages/core, destination-subscriptions, etc.).
    // Changes labeled with ACTIONS_CORE_LABEL require two human reviewers.
    const ACTIONS_CORE_LABEL = 'actions:core'
    const CORE_REVIEW_TEAM = 'strategic-connections-team'
    const CORE_MIN_REVIEWERS = 2
    const DEFAULT_REVIEWER = 'joe-ayoub-segment'
    const excludedMembers = ['sandeeptwilio', 'joe-ayoub-segment']

    // Determine whether this PR touches actions-core, from both the labels being added
    // and labels already present on the PR.
    const addedLabels = (labelsToAdd || '').split(',').map((l) => l.trim()).filter(Boolean)
    const prLabels = context.payload.pull_request.labels.map((label) => label.name)
    const isCoreChange = addedLabels.includes(ACTIONS_CORE_LABEL) || prLabels.includes(ACTIONS_CORE_LABEL)
    const prAuthor = context.payload.pull_request.user.login

    // Bots such as Copilot are auto-requested as reviewers on some PRs. They must not
    // count as human reviewers, otherwise reviewer assignment is skipped entirely.
    const isHumanReviewer = (user) => user && user.type !== 'Bot' && user.login !== 'Copilot'

    // Select up to `count` eligible members from a team, skipping the PR author, excluded
    // members, and anyone already selected. Members are picked consecutively from a random
    // starting position to spread review load.
    async function pickTeamMembers(teamSlug, count, alreadySelected = []) {
        const team = await github.rest.teams.listMembersInOrg({
            team_slug: teamSlug,
            org: context.repo.owner
        })

        if (team.data.length === 0) {
            return []
        }

        const eligibleMembers = team.data.filter((member) =>
            member.login !== prAuthor &&
            !excludedMembers.includes(member.login) &&
            !alreadySelected.includes(member.login)
        )

        // If filtering leaves nobody, fall back to any member not already selected.
        const membersToSelectFrom = eligibleMembers.length > 0
            ? eligibleMembers
            : team.data.filter((member) => !alreadySelected.includes(member.login))

        if (membersToSelectFrom.length === 0) {
            return []
        }

        const numReviewers = Math.min(count, membersToSelectFrom.length)
        const startIndex = Math.floor(Math.random() * membersToSelectFrom.length)
        const selected = []
        for (let i = 0; i < numReviewers; i++) {
            const index = (startIndex + i) % membersToSelectFrom.length
            selected.push(membersToSelectFrom[index].login)
        }
        return selected
    }

    // Check if there are already reviewers assigned to the PR
    try {
        const existingReviewers = await github.rest.pulls.listRequestedReviewers({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.payload.pull_request.number
        })

        // Ignore bot reviewers (e.g. Copilot) when deciding whether humans are already assigned.
        const humanReviewers = (existingReviewers.data.users || []).filter(isHumanReviewer)

        if (humanReviewers.length > 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', `PR already has ${humanReviewers.length} user reviewer(s) assigned: ${humanReviewers.map(u => u.login).join(', ')}`)
            core.info(`Skipping reviewer assignment - users already assigned: ${humanReviewers.map(u => u.login).join(', ')}`)
            return
        }
    } catch (error) {
        core.info(`Failed to check existing reviewers: ${error.message}`)
        core.setOutput('skip', 'true')
        core.setOutput('reason', `Failed to check existing reviewers: ${error.message}`)
        return
    }

    // actions-core changes must always be reviewed by two strategic-connections-team members,
    // regardless of who opened the PR or which other teams the PR routes to. This takes
    // priority over the external/team routing below.
    if (isCoreChange) {
        const reviewers = await pickTeamMembers(CORE_REVIEW_TEAM, CORE_MIN_REVIEWERS)
        if (reviewers.length === 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', `no eligible ${CORE_REVIEW_TEAM} members found for actions-core review`)
            return
        }
        core.setOutput('reviewers', reviewers.join(','))
        core.setOutput('team', CORE_REVIEW_TEAM)
        core.setOutput('skip', 'false')
        core.info(`actions-core change: assigned ${reviewers.join(', ')} from ${CORE_REVIEW_TEAM}`)
        return
    }

    // Check if team:external label is being added or already exists on the PR
    if ((labelsToAdd && labelsToAdd.split(',').includes('team:external')) || prLabels.includes('team:external')) {
        core.setOutput('reviewers', DEFAULT_REVIEWER)
        core.setOutput('team', 'external')
        core.setOutput('skip', 'false')
        core.info(`Assigned ${DEFAULT_REVIEWER} for external contributor PR`)
        return
    }

    // Function to get teams from existing reviewers
    async function getTeamFromGitHub() {
        try {
            // Get the list of requested reviewers (teams and individuals)
            const requestedReviewers = await github.rest.pulls.listRequestedReviewers({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.payload.pull_request.number
            })

            core.info(`GitHub requested reviewers: ${JSON.stringify(requestedReviewers.data)}`)

            // Extract teams from requested reviewers
            const teams = []
            if (requestedReviewers.data.teams && requestedReviewers.data.teams.length > 0) {
                for (const team of requestedReviewers.data.teams) {
                    teams.push(team.slug)
                }
            }

            if (teams.length > 0) {
                // Return the first team
                const selectedTeam = teams[0]
                core.info(`Selected team from requested reviewers: ${selectedTeam}`)
                return selectedTeam
            }

            core.info('No teams found in requested reviewers')
            return null

        } catch (error) {
            core.info(`Failed to get teams from GitHub: ${error.message}`)
            return null
        }
    }

    // Get team assignment from GitHub's CODEOWNERS evaluation
    const teamToAssign = await getTeamFromGitHub()

    if (!teamToAssign) {
        core.setOutput('reviewers', DEFAULT_REVIEWER)
        core.setOutput('team', 'other')
        core.setOutput('skip', 'false')
        core.info(`No team assigned, defaulting to ${DEFAULT_REVIEWER}`)
        return
    }

    // Special handling for strategic-connections-team: only assign joe-ayoub-segment if author is not in team
    if (teamToAssign === 'strategic-connections-team') {
        // Check if PR author is a member of strategic-connections-team
        let isAuthorInTeam = false
        try {
            const team = await github.rest.teams.listMembersInOrg({
                team_slug: teamToAssign,
                org: context.repo.owner
            })
            isAuthorInTeam = team.data.some(member => member.login === prAuthor)
            core.info(`PR author ${prAuthor} is ${isAuthorInTeam ? 'in' : 'not in'} ${teamToAssign}`)
        } catch (error) {
            core.info(`Failed to check team membership: ${error.message}`)
        }

        if (!isAuthorInTeam) {
            // PR targeting strategic-connections-team from non-team member -> assign to joe-ayoub-segment
            core.setOutput('reviewers', DEFAULT_REVIEWER)
            core.setOutput('team', 'other')
            core.setOutput('skip', 'false')
            core.info(`PR targeting ${teamToAssign} from non-team member, assigned to ${DEFAULT_REVIEWER}`)
            return
        }
        // If author is in team, continue to team assignment logic below
    }

    // Get team members (assign from target team regardless of author's team membership).
    // Always request 2 reviewers so that actions-core changes are double-reviewed; other
    // changes routed to a team keep the existing 2-reviewer behavior.
    try {
        const reviewerLogins = await pickTeamMembers(teamToAssign, CORE_MIN_REVIEWERS)

        if (reviewerLogins.length === 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', `no team members found in ${teamToAssign}`)
            return
        }

        core.setOutput('reviewers', reviewerLogins.join(','))
        core.setOutput('team', teamToAssign)
        core.setOutput('skip', 'false')
        core.info(`Selected ${reviewerLogins.join(', ')} from ${teamToAssign} (excluded PR author: ${prAuthor})`)

    } catch (error) {
        core.setOutput('skip', 'true')
        core.setOutput('reason', `failed to get ${teamToAssign} members: ${error.message}`)
    }
}