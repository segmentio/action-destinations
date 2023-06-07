import path from 'path'

import type { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'

export { BrowserDestinationDefinition } from '@segment/browser-destination-runtime/types'

type MetadataId = string

export interface ManifestEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definition: BrowserDestinationDefinition<any, any>
  directory: string
  path: string
}

export const manifest: Record<MetadataId, ManifestEntry> = {}

function register(id: MetadataId, destinationName: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const definition = require(destinationName).destination
  const entryFilePath = require.resolve(destinationName)
  const directory = path.basename(path.resolve(entryFilePath, '../../..'))

  manifest[id] = {
    definition,
    directory,
    path: entryFilePath
  }
}

// TODO figure out if it's possible to colocate the Amplitude web action with the rest of its destination definition (in `./packages/destination-actions`)
register('61fc2ffcc76fb3e73d85c89d', '@segment/actions-adobe-target-web')
register('5f7dd6d21ad74f3842b1fc47', '@segment/actions-amplitude-plugins')
register('60fb01aec459242d3b6f20c1', '@segment/actions-braze-web')
register('60f9d0d048950c356be2e4da', '@segment/actions-braze-cloud-plugins')
register('6170a348128093cd0245e0ea', '@segment/actions-friendbuy')
register('6141153ee7500f15d3838703', '@segment/actions-fullstory')
register('6230c835c0d6535357ee950d', '@segment/actions-koala')
register('61d8859be4f795335d5c677c', '@segment/actions-stackadapt')
register('61d8c74d174a9acd0e138b31', '@segment/actions-sprig-web')
register('62b256147cbb49302d1486d0', '@segment/actions-heap-web')
register('62d9daff84a6bf190da9f592', '@segment/actions-intercom-web')
register('62fec615a42fa3dbfd208ce7', '@segment/actions-iterate')
register('631a1c2bfdce36a23f0a14ec', '@segment/actions-hubspot-web')
register('6340a951fbda093061f5f1d7', '@segment/actions-segment-utilities-web')
register('634ef204885be3def430af66', '@segment/actions-playerzero-web')
register('635ada35ce269dbe305203ff', '@segment/actions-logrocket')
register('6372e18fb2b3d5d741c34bb6', '@segment/actions-sabil')
register('6372e1e36d9c2181f3900834', '@segment/actions-wisepops')
register('637c192eba61b944e08ee158', '@segment/actions-vwo-web')
register('638f843c4520d424f63c9e51', '@segment/actions-commandbar')
register('63913b2bf906ea939f153851', '@segment/actions-ripe')
register('63ed446fe60a1b56c5e6f130', '@segment/actions-google-analytics-4-web')
register('640267d74c13708d74062dcd', '@segment/actions-upollo')
register('6480b4eeab29eca5415089d4', '@segment/actions-userpilot')
register('64820d8030d09e775fbac372', '@segment/actions-screeb')
