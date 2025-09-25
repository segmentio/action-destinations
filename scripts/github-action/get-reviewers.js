// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const { labelsToAdd } = process.env

    // Check if there are already reviewers assigned to the PR
    try {
        const existingReviewers = await github.rest.pulls.listRequestedReviewers({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.payload.pull_request.number
        })

        if (existingReviewers.data.users && existingReviewers.data.users.length > 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', `PR already has ${existingReviewers.data.users.length} user reviewer(s) assigned: ${existingReviewers.data.users.map(u => u.login).join(', ')}`)
            core.info(`Skipping reviewer assignment - users already assigned: ${existingReviewers.data.users.map(u => u.login).join(', ')}`)
            return
        }
    } catch (error) {
        core.info(`Failed to check existing reviewers: ${error.message}`)
        core.setOutput('skip', 'true')
        core.setOutput('reason', `Failed to check existing reviewers: ${error.message}`)
        return
    }

    // Check if team:external label is being added
    if (labelsToAdd && labelsToAdd.split(',').includes('team:external')) {
        core.setOutput('reviewers', 'joe-ayoub-segment')
        core.setOutput('team', 'external')
        core.setOutput('skip', 'false')
        core.info('Assigned joe-ayoub-segment for external contributor PR')
        return
    }

    // Check if team:external label already exists on the PR
    const existingLabels = context.payload.pull_request.labels.map((label) => label.name)
    if (existingLabels.includes('team:external')) {
        core.setOutput('reviewers', 'joe-ayoub-segment')
        core.setOutput('team', 'external')
        core.setOutput('skip', 'false')
        core.info('Assigned joe-ayoub-segment for external contributor PR (existing label)')
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
        core.setOutput('reviewers', 'joe-ayoub-segment')
        core.setOutput('team', 'other')
        core.setOutput('skip', 'false')
        core.info('No team assigned, defaulting to joe-ayoub-segment')
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
            const prAuthor = context.payload.pull_request.user.login
            isAuthorInTeam = team.data.some(member => member.login === prAuthor)
            core.info(`PR author ${prAuthor} is ${isAuthorInTeam ? 'in' : 'not in'} ${teamToAssign}`)
        } catch (error) {
            core.info(`Failed to check team membership: ${error.message}`)
        }

        if (!isAuthorInTeam) {
            // PR targeting strategic-connections-team from non-team member -> assign to joe-ayoub-segment
            core.setOutput('reviewers', 'joe-ayoub-segment')
            core.setOutput('team', 'other')
            core.setOutput('skip', 'false')
            core.info(`PR targeting ${teamToAssign} from non-team member, assigned to joe-ayoub-segment`)
            return
        }
        // If author is in team, continue to team assignment logic below
    }

    // Get team members (assign from target team regardless of author's team membership)
    try {
        const team = await github.rest.teams.listMembersInOrg({
            team_slug: teamToAssign,
            org: context.repo.owner
        })

        if (team.data.length === 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', `no team members found in ${teamToAssign}`)
            return
        }

        // Filter out the PR author and excluded members
        const prAuthor = context.payload.pull_request.user.login
        const excludedMembers = ['sandeeptwilio']
        const eligibleMembers = team.data.filter(member =>
            member.login !== prAuthor && !excludedMembers.includes(member.login)
        )

        // If no eligible members after filtering author, use all team members
        const membersToSelectFrom = eligibleMembers.length > 0 ? eligibleMembers : team.data

        // Get 2 consecutive members from the available team members (or all available if less than 2)
        const numReviewers = Math.min(2, membersToSelectFrom.length)

        // Select a random starting position and take consecutive members
        const startIndex = Math.floor(Math.random() * membersToSelectFrom.length)
        const selectedMembers = []

        for (let i = 0; i < numReviewers; i++) {
            const index = (startIndex + i) % membersToSelectFrom.length
            selectedMembers.push(membersToSelectFrom[index])
        }

        const reviewerLogins = selectedMembers.map(member => member.login)
        core.setOutput('reviewers', reviewerLogins.join(','))
        core.setOutput('team', teamToAssign)
        core.setOutput('skip', 'false')

        const authorInfo = eligibleMembers.length !== team.data.length ? ` (excluded PR author: ${prAuthor})` : ''
        core.info(`Selected ${reviewerLogins.join(', ')} (consecutive from index ${startIndex}) from ${membersToSelectFrom.length} available members in ${teamToAssign}${authorInfo}`)

    } catch (error) {
        core.setOutput('skip', 'true')
        core.setOutput('reason', `failed to get ${teamToAssign} members: ${error.message}`)
    }
}