import { Hook } from '@oclif/config'

const hook: Hook<'init'> = async function ({ config }) {
  if (process.env.NODE_ENV === 'TEST') {
    console.warn('skipping cli-internal plugin because of tests')
    return
  }

  const cpsSupport = await isCpsSupported()
  if (!cpsSupport) {
    return
  }

  const path = require.resolve('@segment/cli-internal')

  // @ts-ignore loadPlugins is not recognized as a valid method
  await config.loadPlugins(path, 'user', [
    {
      type: 'user',
      name: '@segment/cli-internal',
      root: path
    }
  ])
}

async function isCpsSupported() {
  try {
    await import('@segment/control-plane-service-client')
    return true
  } catch (err) {
    return err?.code !== 'MODULE_NOT_FOUND'
  }
}

export default hook
