import { Hook, Plugin } from '@oclif/config'
import { dirname } from 'path'

const hook: Hook<'init'> = async function ({ config }) {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  let cpsModule: string
  try {
    cpsModule = require.resolve('@segment/control-plane-service-client')
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return
    }

    throw err
  }

  // require.resolve returns the main module but we want the directory
  // of the plugin so Oclif can read the package.json.
  const cpsDir = dirname(cpsModule)
    .split('/')
    .slice(0, -1)
    .join('/')

  const plugin = new Plugin({
    type: 'user',
    name: '@segment/actions-cli-internal',
    root: cpsDir
  })
  await plugin.load()

  config.plugins.push(plugin)
}

export default hook
