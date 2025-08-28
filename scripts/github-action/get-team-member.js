// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const { labelsToAdd } = process.env

    // Check if team:external label is being added
    if (labelsToAdd && labelsToAdd.split(',').includes('team:external')) {
        core.setOutput('skip', 'true')
        core.setOutput('reason', 'external contributor')
        return
    }

    // Check if team:external label already exists on the PR
    const existingLabels = context.payload.pull_request.labels.map((label) => label.name)
    if (existingLabels.includes('team:external')) {
        core.setOutput('skip', 'true')
        core.setOutput('reason', 'external contributor (existing label)')
        return
    }

    // Determine which team should review based on the labels being added
    function determineReviewingTeam(labelsToAdd, existingLabels) {
        const allLabels = [...(labelsToAdd ? labelsToAdd.split(',') : []), ...existingLabels]

        // Priority-based team assignment
        if (allLabels.includes('actions:core')) {
            return 'strategic-connections-team'
        }

        if (allLabels.includes('actions:mappingkit')) {
            return 'libraries-web-team'
        }

        if (allLabels.includes('mode:cloud') || allLabels.includes('mode:device')) {
            return 'strategic-connections-team'
        }

        // If team:segment-core label is present, assign to libraries-web-team
        if (allLabels.includes('team:segment-core')) {
            return 'strategic-connections-team'
        }

        // Default fallback for internal contributors
        if (allLabels.includes('team:segment')) {
            return 'strategic-connections-team'
        }

        return null
    }

    const teamToAssign = determineReviewingTeam(labelsToAdd, existingLabels)

    // Only proceed for strategic-connections-team
    if (teamToAssign !== 'strategic-connections-team') {
        core.setOutput('skip', 'true')
        core.setOutput('reason', `only assigning for strategic-connections-team, found ${teamToAssign || 'none'}`)
        return
    }

    // Get a random team member
    try {
        const team = await github.rest.teams.listMembersInOrg({
            team_slug: teamToAssign,
            org: context.repo.owner
        })

        if (team.data.length === 0) {
            core.setOutput('skip', 'true')
            core.setOutput('reason', 'no team members found')
            return
        }

        // Get a random member from the team
        const randomIndex = Math.floor(Math.random() * team.data.length)
        const selectedMember = team.data[randomIndex]

        core.setOutput('reviewer', selectedMember.login)
        core.setOutput('team', teamToAssign)
        core.setOutput('skip', 'false')
        core.info(`Selected ${selectedMember.login} from ${team.data.length} members in ${teamToAssign}`)

    } catch (error) {
        core.setOutput('skip', 'true')
        core.setOutput('reason', `failed to get team members: ${error.message}`)
    }
}
