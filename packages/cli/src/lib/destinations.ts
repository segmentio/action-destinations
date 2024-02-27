import type { ManifestEntry as BrowserManifest, BrowserDestinationDefinition } from '@segment/destinations-manifest'
import type { DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import type { ManifestEntry as CloudManifest } from '@segment/action-destinations'
import path from 'path'
import { clearRequireCache } from './require-cache'
import { OAUTH_SCHEME } from '../constants'

export type DestinationDefinition = CloudDestinationDefinition | BrowserDestinationDefinition
type ManifestEntry = CloudManifest | BrowserManifest

/**
 * Attempts to load a destination definition from a given file path
 * Note: this requires ts-node when loading .ts files
 */
export async function loadDestination(filePath: string): Promise<null | DestinationDefinition> {
  const importPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath)

  // Clear Node's require cache to pick up any changes
  clearRequireCache()

  // Import the file, assert that it's a destination definition entrypoint
  const module = require(importPath)
  // look for `default` or `destination` export
  const destination = module.destination || module.default

  // Loose validation on a destination definition
  if (!destination?.name || typeof destination?.actions !== 'object') {
    return null
  }

  return destination
}

// Right now it's possible for browser destinations and cloud destinations to have the same
// metadataId. This is because we currently rely on a separate directory for all web actions.
// So here we need to intelligently merge them until we explore colocating all actions with a single
// definition file.
export const getManifest: () => Record<string, CloudManifest | BrowserManifest> = () => {
  const { manifest: browserManifest } = require('@segment/destinations-manifest')
  const { manifest: cloudManifest } = require('@segment/action-destinations')
  const { mergeWith } = require('lodash')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return mergeWith({}, cloudManifest, browserManifest, (objValue: ManifestEntry, srcValue: ManifestEntry) => {
    if (Object.keys(objValue?.definition?.actions ?? {}).length === 0) {
      return
    }

    for (const [actionKey, action] of Object.entries(srcValue.definition?.actions ?? {})) {
      if (actionKey in objValue.definition.actions) {
        throw new Error(
          `Could not merge browser + cloud actions because there is already an action with the same key "${actionKey}"`
        )
      }

      objValue.definition.actions[actionKey] = action
    }

    return objValue
  })
}

export function hasOauthAuthentication(definition: DestinationDefinition): boolean {
  return (
    'authentication' in definition &&
    !!definition.authentication &&
    'scheme' in definition.authentication &&
    definition.authentication.scheme === OAUTH_SCHEME
  )
}
