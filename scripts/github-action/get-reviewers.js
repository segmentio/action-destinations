// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const { labelsToAdd } = process.env

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

    // Determine which team should review based on the labels being added
    function determineReviewingTeam(labelsToAdd, existingLabels) {
        const allLabels = [...(labelsToAdd ? labelsToAdd.split(',') : []), ...existingLabels]

        // Priority-based team assignment
        if (allLabels.includes('actions:mappingkit')) {
            return 'libraries-web-team'
        }

        const stratConnLabels = ['actions:core', 'mode:cloud', 'mode:device', 'team:segment-core', 'team:segment']
        if (stratConnLabels.some(label => allLabels.includes(label))) {
            return 'strategic-connections-team'
        }

        return null
    }

    const teamToAssign = determineReviewingTeam(labelsToAdd, existingLabels)

    const teamsNeedReviewers = ['strategic-connections-team', 'libraries-web-team']

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

    // Check if we should assign reviewers from a specific team
    if (teamsNeedReviewers.includes(teamToAssign)) {
        core.info(`PR targeting ${teamToAssign}, assigning 2 reviewers from same team`)
        // Continue to team assignment logic below
    } else {
        // No specific team assignment -> assign to joe-ayoub-segment
        core.setOutput('reviewers', 'joe-ayoub-segment')
        core.setOutput('team', 'other')
        core.setOutput('skip', 'false')
        core.info('No specific team assignment, assigned to joe-ayoub-segment')
        return
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

        // Filter out the PR author if they are in the target team (to avoid self-review)
        const prAuthor = context.payload.pull_request.user.login
        const eligibleMembers = team.data.filter(member => member.login !== prAuthor)

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
