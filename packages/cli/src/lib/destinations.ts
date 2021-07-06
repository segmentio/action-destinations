import { DestinationDefinition } from '@segment/actions-core'
import path from 'path'
import { clearRequireCache } from './require-cache'

/** Attempts to load a destination definition from a given file path */
export async function loadDestination(filePath: string): Promise<null | DestinationDefinition> {
  const importPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)

  // Clear Node's require cache to pick up any changes
  clearRequireCache()

  // Import the file, assert that it's a destination definition entrypoint
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(importPath)
  // look for `default` or `destination` export
  const destination = module.destination || module.default

  // Loose validation on a destination definition
  if (!destination?.name || typeof destination?.actions !== 'object') {
    return null
  }

  return destination as DestinationDefinition
}
