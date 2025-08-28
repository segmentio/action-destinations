// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const { labelsToAdd } = process.env

    // Check if team:external label is being added
    if (labelsToAdd && labelsToAdd.split(',').includes('team:external')) {
        core.info('Skipping reviewer assignment for external contributor')
        return
    }

    // Check if team:external label already exists on the PR
    const existingLabels = context.payload.pull_request.labels.map((label) => label.name)
    if (existingLabels.includes('team:external')) {
        core.info('Skipping reviewer assignment for external contributor (existing label)')
        return
    }

    // Check if PR already has reviewers assigned
    const pull_number = context.payload.pull_request.number
    const org = context.repo.owner
    const repo = context.repo.repo

    const prDetails = await github.rest.pulls.get({
        owner: org,
        repo: repo,
        pull_number: pull_number
    })

    if (prDetails.data.requested_reviewers.length > 0) {
        core.info('PR already has reviewers assigned')
        return
    }

    // Determine which team should review based on the labels being added
    const teamToAssign = await determineReviewingTeam(labelsToAdd, existingLabels, core)

    // Only assign reviewers for strategic-connections-team
    if (teamToAssign === 'strategic-connections-team') {
        try {
            // Get a random team member to assign as reviewer
            const reviewer = await getRandomTeamMember(github, org, teamToAssign, core)

            if (reviewer) {
                await github.rest.pulls.requestReviewers({
                    owner: org,
                    repo: repo,
                    pull_number: pull_number,
                    reviewers: [reviewer]
                })
                core.info(`Assigned ${reviewer} from ${teamToAssign} team as reviewer`)
            } else {
                // Fallback to team assignment if no individual member found
                await github.rest.pulls.requestReviewers({
                    owner: org,
                    repo: repo,
                    pull_number: pull_number,
                    team_reviewers: [teamToAssign]
                })
                core.info(`Assigned ${teamToAssign} team as reviewers (fallback)`)
            }
        } catch (error) {
            core.warning(`Failed to assign reviewer from ${teamToAssign} team: ${error.message}`)
        }
    } else if (teamToAssign) {
        core.info(`Skipping reviewer assignment for ${teamToAssign} - only assigning for strategic-connections-team`)
    }
}

async function determineReviewingTeam(labelsToAdd, existingLabels, core) {
    const allLabels = [...(labelsToAdd ? labelsToAdd.split(',') : []), ...existingLabels]

    // Priority-based team assignment
    if (allLabels.includes('actions:core') || allLabels.includes('actions:mappingkit')) {
        return 'libraries-web-team'
    }

    if (allLabels.includes('mode:cloud') || allLabels.includes('mode:device')) {
        return 'strategic-connections-team'
    }

    // If team:segment-core label is present, assign to libraries-web-team
    if (allLabels.includes('team:segment-core')) {
        return 'libraries-web-team'
    }

    // Default fallback for internal contributors
    if (allLabels.includes('team:segment')) {
        return 'strategic-connections-team'
    }

    core.info('No specific team determined for reviewer assignment')
    return null
}

async function getRandomTeamMember(github, org, teamSlug, core) {
    try {
        const team = await github.rest.teams.listMembersInOrg({
            team_slug: teamSlug,
            org: org
        })

        if (team.data.length === 0) {
            core.warning(`No members found in team ${teamSlug}`)
            return null
        }

        // Get a random member from the team
        const randomIndex = Math.floor(Math.random() * team.data.length)
        const selectedMember = team.data[randomIndex]

        core.info(`Selected ${selectedMember.login} from ${team.data.length} members in ${teamSlug}`)
        return selectedMember.login

    } catch (error) {
        core.warning(`Failed to get team members for ${teamSlug}: ${error.message}`)
        return null
    }
}
