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
register('6230c835c0d6535357ee950d', './koala')
register('61d8859be4f795335d5c677c', './stackadapt')
register('61d8c74d174a9acd0e138b31', './sprig-web')
register('62b256147cbb49302d1486d0', './heap')
register('62d9daff84a6bf190da9f592', './intercom')
register('62fec615a42fa3dbfd208ce7', './iterate')
register('631a1c2bfdce36a23f0a14ec', './hubspot-web')
register('6340a951fbda093061f5f1d7', './segment-utilities-web')
register('634ef204885be3def430af66', './playerzero-web')
register('635ada35ce269dbe305203ff', './logrocket')
register('6372e18fb2b3d5d741c34bb6', './sabil')
register('6372e1e36d9c2181f3900834', './wisepops')
register('637c192eba61b944e08ee158', './vwo')
register('638f843c4520d424f63c9e51', './commandbar')
register('63913b2bf906ea939f153851', './ripe')
register('63ed446fe60a1b56c5e6f130', './google-analytics-4-web')
register('640267d74c13708d74062dcd', './upollo')
