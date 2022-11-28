import type { Command } from '@oclif/command'
import chalk from 'chalk'

const warning = chalk.red`
🚨🚨🚨🚨🚨 Warning 🚨🚨🚨🚨🚨🚨
Internal CLI Commands have been deprecated
please see the action-cli repo for more details
🚨🚨🚨🚨🚨 Warning 🚨🚨🚨🚨🚨🚨
`

const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const deprecationWarning = async (warn: Command['warn']) => {
  warn(warning)
  await wait(5000)
}

export default deprecationWarning
