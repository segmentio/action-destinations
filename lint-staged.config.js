const { exec } = require('child_process')

let branch = ''
exec("git branch --show-current", (error, stdout, stderr) => {
    if (stdout) {
        branch = stdout
        console.log('branch', branch)
        return
    }
    if (stderr) {
        return
    }
    if (error) {
        return
    }
})

module.exports = {
    '*': () => {
        return `gitleaks --repo-url=.git -v --additional-config=.husky/gitleaks-rules.toml --unstaged --branch=${branch}`
    }
}