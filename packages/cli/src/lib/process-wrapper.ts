import hook from './require-hook'

// Remove process-wrapper.ts from the argv array
process.argv.splice(1, 1)
const script = process.argv[1]

// We want to exit on SIGTERM, but defer to existing SIGTERM handlers.
process.once('SIGTERM', () => process.listenerCount('SIGTERM') || process.exit(0))

// Hook into require() and notify the parent process about required files
hook(module, (required) => {
    if (process.connected) {
        process.send?.({ required, cmd: 'segment' })
    }
})

// Execute the wrapped script
require(script)