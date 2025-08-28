// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const reviewer = process.env.REVIEWER
    const team = process.env.TEAM

    // Check if PR already has reviewers assigned
    const prDetails = await github.rest.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number
    })

    if (prDetails.data.requested_reviewers.length > 0 || prDetails.data.requested_teams.length > 0) {
        core.info('PR already has reviewers assigned')
        return
    }

    try {
        await github.rest.pulls.requestReviewers({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.payload.pull_request.number,
            reviewers: [reviewer]
        })
        core.info(`Assigned ${reviewer} from ${team} team as reviewer`)
    } catch (error) {
        core.error(`Failed to assign ${reviewer} as reviewer: ${error.message}`)
    }
}
