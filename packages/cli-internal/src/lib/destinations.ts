import type { DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import type { BrowserDestinationDefinition } from '@segment/browser-destinations'
import path from 'path'
import { clearRequireCache } from './require-cache'
import { OAUTH_SCHEME } from '../constants'

export type DestinationDefinition = CloudDestinationDefinition | BrowserDestinationDefinition

/**
 * Attempts to load a destination definition from a given file path
 * Note: this requires ts-node when loading .ts files
 */
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

  return destination
}

export function hasOauthAuthentication(definition: DestinationDefinition): boolean {
  return (
    'authentication' in definition &&
    !!definition.authentication &&
    'scheme' in definition.authentication &&
    definition.authentication.scheme === OAUTH_SCHEME
  )
}
