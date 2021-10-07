import { Hook } from '@oclif/config'

const hook: Hook<'init'> = async function ({ config }) {
    const cpsSupport = await isCpsSupported()
    if (!cpsSupport) {
        return
    }

    const path = require.resolve('@segment/cli-internal')

    // @ts-ignore
    await config.loadPlugins(path, 'user', [{
        type: 'user',
        name: '@segment/cli-internal',
        root: path
    }]);
}

async function isCpsSupported() {
    try {
        await import('@segment/control-plane-service-client')
        return true
    } catch (err: { code: string }) {
        return err.code !== 'MODULE_NOT_FOUND'
    }
}

export default hook