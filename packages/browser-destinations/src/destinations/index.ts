import type { BrowserDestinationDefinition } from '../lib/browser-destinations'
import path from 'path'

type MetadataId = string

export interface ManifestEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definition: BrowserDestinationDefinition<any, any>
  directory: string
  path: string
}

export const manifest: Record<MetadataId, ManifestEntry> = {}

function register(id: MetadataId, destinationPath: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const definition = require(destinationPath).destination
  const resolvedPath = require.resolve(destinationPath)
  const [directory] = path.dirname(resolvedPath).split(path.sep).reverse()

  manifest[id] = {
    definition,
    directory,
    path: resolvedPath
  }
}

// TODO figure out if it's possible to colocate the Amplitude web action with the rest of its destination definition (in `./packages/destination-actions`)
register('61fc2ffcc76fb3e73d85c89d', './adobe-target')
register('5f7dd6d21ad74f3842b1fc47', './amplitude-plugins')
register('60fb01aec459242d3b6f20c1', './braze')
register('60f9d0d048950c356be2e4da', './braze-cloud-plugins')
register('6170a348128093cd0245e0ea', './friendbuy')
register('6141153ee7500f15d3838703', './fullstory')
// register('<koala-destination-id>', './koala')
register('61d8859be4f795335d5c677c', './stackadapt')
register('61d8c74d174a9acd0e138b31', './sprig-web')
