// This is a github action script and can be run only from github actions. To run this script locally, you need to mock the github object and context object.
//
// Enforces that an AI deep review was run on the PR's current head commit:
//   1. a review-toolkit review comment (identified by its hidden
//      `<!-- review-toolkit:state {...} -->` marker) posted by an org
//      member/collaborator, with depth "deep", complete, and reviewed_sha equal
//      to the PR head SHA; and
//   2. a review from the GitHub Copilot reviewer bot.
// Draft PRs and bot-authored PRs (dependabot, release) are skipped.
module.exports = async ({ github, context, core }) => {
    const MARKER_RE = /<!--\s*review-toolkit:state\s*(\{.*?\})\s*-->/s
    const TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR']
    const REQUIRED_DEPTH = 'deep'
    const COPILOT_LOGIN = 'copilot-pull-request-reviewer[bot]'

    const eventPr = context.payload.pull_request
    if (!eventPr) {
        core.setFailed('No pull_request found in the event payload.')
        return
    }

    const owner = context.repo.owner
    const repo = context.repo.repo
    const pull_number = eventPr.number

    // Re-read the PR so a re-run after a push evaluates the current head.
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number })

    if (pr.draft) {
        core.info('Draft PR; AI review evidence is not required until it is ready for review.')
        return
    }
    if (pr.user.type === 'Bot') {
        core.info(`PR authored by bot ${pr.user.login}; skipping.`)
        return
    }

    const comments = await github.paginate(github.rest.issues.listComments, {
        owner,
        repo,
        issue_number: pull_number,
        per_page: 100
    })

    // Latest qualifying review-toolkit comment wins; anyone can paste a marker, so
    // only comments by trusted associations count.
    let claude
    for (const comment of comments) {
        if (!TRUSTED_ASSOCIATIONS.includes(comment.author_association)) continue
        const match = MARKER_RE.exec(comment.body || '')
        if (!match) continue
        try {
            claude = { ...JSON.parse(match[1]), author: comment.user.login }
        } catch (error) {
            core.warning(`Ignoring unparseable review-toolkit marker in comment ${comment.id}.`)
        }
    }

    const reviews = await github.paginate(github.rest.pulls.listReviews, {
        owner,
        repo,
        pull_number,
        per_page: 100
    })
    const copilotReviewed = reviews.some((review) => review.user && review.user.login === COPILOT_LOGIN)

    const problems = []
    if (!claude) {
        problems.push(`no review-toolkit review comment from a repo member (run \`/review-toolkit:review --depth ${REQUIRED_DEPTH}\` against this PR and post the result)`)
    } else if (claude.reviewed_sha !== pr.head.sha) {
        problems.push(`the review-toolkit review covers ${String(claude.reviewed_sha).slice(0, 7)}, but the PR head is ${pr.head.sha.slice(0, 7)}; re-run it`)
    } else if (claude.depth !== REQUIRED_DEPTH || claude.complete !== true) {
        problems.push(`the review-toolkit review must be a complete "${REQUIRED_DEPTH}" review (got depth="${claude.depth}", complete=${claude.complete})`)
    }
    if (!copilotReviewed) {
        problems.push('no GitHub Copilot review (request one from the Reviewers menu)')
    }

    if (problems.length) {
        core.setFailed(`AI review requirements not met: ${problems.join('; ')}. Re-run this check after fixing.`)
        return
    }
    core.info(`AI deep review by ${claude.author} covers ${pr.head.sha.slice(0, 7)}; Copilot review present.`)
}
