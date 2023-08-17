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
 *
 */
register('60f64ae3eaebd66d17d28e9f', './1plusx')
register('6388fddea33fcc69c0f8d9ce', './actable-predictive')
register('61aa712b857e8c85c3b5a849', './adobe-target')
register('5f7dd6d21ad74f3842b1fc47', './amplitude')
register('60f9d0d048950c356be2e4da', './braze')
register('61d7456b078e79929de4ee8c', './clevertap')
register('61f8296b7d15c30a3bbe2b76', './close')
register('61eed75ba749df7601b12186', './cordial')
register('6238cec53a46dd187d094eb7', './criteo-audiences')
register('5f7dd78fe27ce7ff2b8bfa37', './customerio')
register('63f65c1c42e3bded41f0499c', './emarsys')
register('6101bf0e15772f7e12407fa9', './engage-messaging-sendgrid')
register('6116a41e2e8fc680d8daf821', './engage-messaging-twilio')
register('61806e472cd47ea1104885fc', './facebook-conversions-api')
register('645d5fc12eb891cf0a93fe4b', './facebook-custom-audiences')
register('61dde0dc77eb0db0392649d3', './friendbuy')
register('62d9aa9899b06480f83e8a66', './fullstory')
register('61f83101210c42a28a88d240', './gainsight-px-cloud-action')
register('60ad61f9ff47a16b8fb7b5d9', './google-analytics-4')
register('60ae8b97dcb6cc52d5d0d5ab', './google-enhanced-conversions')
register('627ea052118e3cd530d28963', './google-sheets')
register('62e184d538b54413fe754512', './heap')
register('624dddd054ced46facfdb9c0', './launchdarkly')
register('63360a5fe290ca3fdfad4a68', './loops')
register('62f435d1d311567bd5bf0e8d', './linkedin-audiences')
register('615c7438d93d9b61b1e9e192', './mixpanel')
register('61a8032ea5f157ee37a720be', './metronome')
register('620feaa207e70f6c6a765ff7', './moengage')
register('62df16e45ba0058c864a75d1', './actions-pardot')
register('5f7dd8191ad74f868ab1fc48', './pipedrive')
register('62e17e6f687e4a3d32d0f875', './qualtrics')
register('63cade592992cf7052ce2e3e', './ripe')
register('61957755c4d820be968457de', './salesforce')
register('62e30bad99f1bfb98ee8ce08', './salesforce-marketing-cloud')
register('5f7dd8e302173ff732db5cc4', './slack')
register('6261a8b6cb4caa70e19116e8', './snap-conversions-api')
register('6234b137d3b6404a64f2a0f0', './talon-one')
register('615cae349d109d6b7496a131', './tiktok-conversions')
register('63d2e550fb90f1632ed8820a', './tiktok-audiences')
register('602efa1f249b9a5e2bf8a813', './twilio')
register('614a3c7d791c91c41bae7599', './webhook')
register('61dc4e96894a6d7954cc6e45', './voyage')
register('63f529a8af3478b5a5363c53', './voucherify')
register('62ded0cf5753c743883ca0f3', './intercom')
register('63c874d328bd6bd1aa1f90a0', './ironclad')
register('631a6f32946dd8197e9cab66', './sendgrid')
register('632b1116e0cb83902f3fd717', './hubspot')
register('636d38db78d7834347d76c44', './1plusx-asset-api')
register('6371eee1ae5e324869aa8b1b', './segment')
register('63936c37dbc54a052e34e30e', './google-sheets-dev')
register('63872c01c0c112b9b4d75412', './braze-cohorts')
register('639c2dbb1309fdcad13951b6', './segment-profiles')
register('63bedc136a8484a53739e013', './vwo')
register('63d17a1e6ab3e62212278cd0', './saleswings')
register('63e42aa0ed203bc54eaabbee', './launchpad')
register('63e42b47479274407b671071', './livelike-cloud')
register('63e42bc78efe98bc2a8451c1', './twilio-studio')
register('63e42d44b0a59908dc4cacc6', './blackbaud-raisers-edge-nxt')
register('63e42e512566ad7c7ca6ba9b', './pinterest-conversions')
register('63e52bea7747fbc311d5b872', './algolia-insights')
register('63ff8bae963d5cb4fc79f097', './outfunnel')
register('6408ac6c144a7d5ac55cf414', './toplyne')
register('6411f979382d3759292d739f', './gwen')
register('6419fbec071f03f0e4887a7f', './acoustic')
register('6419fc9da58e84c112de12c3', './revend')
register('6419fce5b6e12cf44efbd34c', './june')
register('642440d46b66b3eeac42b581', './encharge')
register('64244158b33d1380a79dc85c', './blend-ai')
register('641d5acea88fa531b9068608', './optimizely-feature-experimentation-actions')
register('643697130067c2f408ff28ca', './rokt-audiences')
register('643697f531f98a978f414453', './insider')
register('643698ffee21b544f6aa756a', './insider-audiences')
register('643fdecd5675b7a6780d0d67', './podscribe')
register('643fdf094cfdbcf1bcccbc42', './usermaven')
register('6440068936c4fb9f699b0645', './the-trade-desk-crm')
register('6447ca8bfaa773a2ba0777a0', './tiktok-offline-conversions')
register('645babd9362d97b777391325', './iterable')
register('644ad6c6c4a87a3290450602', './liveramp-audiences')
register('6464ef424ac5c5f47f5f3968', './revx')
register('646ce31d67ac1735b1846052', './calliper')
register('6470d73d82dfbc7129fc5975', './noop')
register('6475c5c14f7db4914bcd512f', './airship')
register('647f2f7ce3b561ab931c2b77', './ambee')
register('647f30a35eedd03afde0a1c3', './userpilot')
register('6489bbade6fe3eb57c13bd6a', './canny-functions')
register('6489c893dd5357493f365a96', './koala')
register('6492cbb7df74e63cfa2f3e36', './iqm')
register('6492cbd495feedacdcf431a4', './playerzero-cloud')
register('649adeaa719bd3f55fe81bef', './devrev')
register('649a1418b31e61334c66a7e7', './webhook-audiences')
register('64b67be0d0dd66094c162ca7', './app-fit')
register('64b67add9c22bc2cce3bf8bc', './m3ter')
register('64b6a221baf168a989be641a', './listrak')
register('64c022a713fa5f5a1452c106', './hilo')
register('64c02312ff0ce798cc8d1a7e', './rehook')
register('64c031541451bb784943f809', './attio')
register('64ca21ee1f8f380283837ba1', './prodeology')
register('64d3487dcc68fe039fb6237f', './gameball')

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
