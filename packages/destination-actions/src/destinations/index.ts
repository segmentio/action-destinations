import type { DestinationDefinition } from '@segment/actions-core'
import { Destination } from '@segment/actions-core'
import path from 'path'

type MetadataId = string

export interface ManifestEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definition: DestinationDefinition<any>
  directory: string
  path: string
}

export const destinations: Record<string, DestinationDefinition> = {}
export const manifest: Record<MetadataId, ManifestEntry> = {}

/**
 * Register destinations below to make it available in this package's
 * `destinations` and `manifest` exports used by the `integrations` service
 *
 * To test in staging, the ids should match across environments.
 * It is recommended that you register/create destination definitions
 * in production and sync them into staging via `sprout`.
 */
register('60f64ae3eaebd66d17d28e9f', './1plusx')
register('5f7dd6d21ad74f3842b1fc47', './amplitude')
register('60f9d0d048950c356be2e4da', './braze')
register('5f7dd78fe27ce7ff2b8bfa37', './customerio')
register('60ad61f9ff47a16b8fb7b5d9', './google-analytics-4')
register('60ae8b97dcb6cc52d5d0d5ab', './google-enhanced-conversions')
register('6101bf0e15772f7e12407fa9', './personas-messaging-sendgrid')
register('6116a41e2e8fc680d8daf821', './personas-messaging-twilio')
register('5f7dd8191ad74f868ab1fc48', './pipedrive')
register('5f7dd8e302173ff732db5cc4', './slack')
register('602efa1f249b9a5e2bf8a813', './twilio')
register('614a3c7d791c91c41bae7599', './webhook')

function register(id: MetadataId, destinationPath: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const definition = require(destinationPath).default
  const resolvedPath = require.resolve(destinationPath)
  const [directory] = path.dirname(resolvedPath).split(path.sep).reverse()

  manifest[id] = {
    definition,
    directory,
    path: resolvedPath
  }

  // add to `destinations` export as well (for backwards compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destinations[directory] = definition as DestinationDefinition<any>
}

/** Attempts to load a destination definition from a given file path */
async function getDestinationLazy(slug: string): Promise<null | DestinationDefinition> {
  const destination = await import(`./${slug}`).then((mod) => mod.default)

  // Loose validation on a destination definition
  if (!destination?.name || typeof destination?.actions !== 'object') {
    return null
  }

  return destination
}

async function getDestinationByPathKey(key: string): Promise<Destination | null> {
  const destination = destinations[key] ?? (await getDestinationLazy(key))

  if (!destination) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Destination(destination as DestinationDefinition<any>)
}

export function getDestinationById(id: string): Destination | null {
  const destination = manifest[id]

  if (!destination?.definition) {
    return null
  }

  return new Destination(destination.definition)
}

export async function getDestinationByIdOrKey(idOrPathKey: string): Promise<Destination | null> {
  return getDestinationById(idOrPathKey) ?? getDestinationByPathKey(idOrPathKey)
}
