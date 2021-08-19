export default function hook(wrapper: NodeModule, callback: (filename: string) => void) {
    updateHooks()

    /**
     * (Re-)install hooks for all registered file extensions.
     */
    function updateHooks() {
        Object.keys(require.extensions).forEach((ext) => {
            const fn = require.extensions[ext]
            if (typeof fn === 'function' && fn.name !== 'devHook') {
                require.extensions[ext] = createHook(fn)
            }
        })
    }

    /**
     * Returns a function that can be put into `require.extensions` in order to
     * invoke the callback when a module is required for the first time.
     */
    function createHook(handler: (m: NodeModule, filename: string) => any) {
        return function devHook(module: NodeModule, filename: string) {
            if (module.parent === wrapper) {
                // If the main module is required conceal the wrapper
                module.id = '.'
                module.parent = null
                process.mainModule = module
            }
            if (!module.loaded) callback(module.filename)

            // Invoke the original handler
            handler(module, filename)

            // Make sure the module did not hijack the handler
            updateHooks()
        }
    }
}