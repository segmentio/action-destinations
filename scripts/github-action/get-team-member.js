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

    // Check if PR author is a member of strategic-connections-team
    let isAuthorInStratConn = false
    try {
        const stratConnTeam = await github.rest.teams.listMembersInOrg({
            team_slug: 'strategic-connections-team',
            org: context.repo.owner
        })
        const prAuthor = context.payload.pull_request.user.login
        isAuthorInStratConn = stratConnTeam.data.some(member => member.login === prAuthor)
        core.info(`PR author ${prAuthor} is ${isAuthorInStratConn ? 'in' : 'not in'} strategic-connections-team`)
    } catch (error) {
        core.info(`Failed to check team membership: ${error.message}`)
    }

    // Decision logic:
    // 1. If mappingkit changes -> assign to libraries-web-team
    // 2. If author is from strategic-connections-team -> assign 2 from strategic-connections-team
    // 3. Otherwise -> assign to joe-ayoub-segment

    if (teamToAssign === 'libraries-web-team') {
        core.setOutput('skip', 'true')
        core.setOutput('reason', `mappingkit changes should be handled by ${teamToAssign}`)
        return
    }

    if (isAuthorInStratConn) {
        // PR from strategic-connections-team member -> assign 2 from same team
        core.info('PR from strategic-connections-team member, assigning 2 reviewers from same team')
    } else {
        // PR from other team or external -> assign to joe-ayoub-segment
        core.setOutput('reviewers', 'joe-ayoub-segment')
        core.setOutput('team', 'other')
        core.setOutput('skip', 'false')
        core.info('PR from non-strategic-connections-team member, assigned to joe-ayoub-segment')
        return
    }

    // Get strategic-connections-team members (we only reach here if author is in strategic-connections-team)
    try {
        const team = await github.rest.teams.listMembersInOrg({
            team_slug: 'strategic-connections-team',
            org: context.repo.owner
        })

        if (team.data.length === 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', 'no team members found in strategic-connections-team')
            return
        }

        // Filter out the PR author from potential reviewers
        const prAuthor = context.payload.pull_request.user.login
        const eligibleMembers = team.data.filter(member => member.login !== prAuthor)

        if (eligibleMembers.length === 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', `only PR author (${prAuthor}) found in strategic-connections-team`)
            return
        }

        // Get 2 consecutive members from the eligible team members (or all eligible if less than 2)
        const numReviewers = Math.min(2, eligibleMembers.length)

        // Select a random starting position and take consecutive members
        const startIndex = Math.floor(Math.random() * eligibleMembers.length)
        const selectedMembers = []

        for (let i = 0; i < numReviewers; i++) {
            const index = (startIndex + i) % eligibleMembers.length
            selectedMembers.push(eligibleMembers[index])
        }

        const reviewerLogins = selectedMembers.map(member => member.login)
        core.setOutput('reviewers', reviewerLogins.join(','))
        core.setOutput('team', 'strategic-connections-team')
        core.setOutput('skip', 'false')
        core.info(`Selected ${reviewerLogins.join(', ')} (consecutive from index ${startIndex}) from ${eligibleMembers.length} eligible members in strategic-connections-team (excluded PR author: ${prAuthor})`)

    } catch (error) {
        core.setOutput('skip', 'true')
        core.setOutput('reason', `failed to get strategic-connections-team members: ${error.message}`)
    }
}
