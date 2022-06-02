const { exec } = require('child_process')
const { ["lint-staged"]: config } = require('./package.json')

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
        return `gitleaks protect --config=.husky/gitleaks-rules.toml --staged -v`
    },
    ...config
}
