// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
module.exports = async ({ github, context, core }) => {
    const reviewers = process.env.REVIEWERS
    const team = process.env.TEAM
    
    try {
        const reviewerList = reviewers.split(',')
        await github.rest.pulls.requestReviewers({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.payload.pull_request.number,
            reviewers: reviewerList
        })
        core.info(`Assigned ${reviewerList.join(', ')} from ${team} team as reviewers`)
    } catch (error) {
        core.error(`Failed to assign ${reviewers} as reviewers: ${error.message}`)
    }
}
