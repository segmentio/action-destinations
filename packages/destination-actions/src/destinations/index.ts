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
register('64e72af1eabf77368b877a51', './pushwoosh')
register('64e72a310da9ebedf99c8937', './launchdarkly-audiences')
register('64edec5a4f881f992e432b81', './acoustic-s3tc')
register('64edeb2bee24614fe52ede34', './optimizely-advanced-audience-targeting')
register('64ede9fe67158afa8de61480', './dynamic-yield-audiences')
register('64f703d1f6e9aa0a283ae3e2', './absmartly')
register('6514281004d549fae3fd086a', './yahoo-audiences')
register('650bdf1a62fb34ef0a8058e1', './klaviyo')
register('6512d7f86bdccc3829fc4ac3', './optimizely-data-platform')
register('651c1db19de92d8e595ff55d', './hyperengage')
register('65256052ac030f823df6c1a5', './trackey')
register('652e765dbea0a2319209d193', './linkedin-conversions')
register('652ea51a327a62b351aa12c0', './kameleoon')
register('65302a514ce4a2f0f14cd426', './marketo-static-lists')
register('65302a3acb309a8a3d5593f2', './display-video-360')
register('6537b4236b16986dba32583e', './apolloio')
register('6537b55db9e94b2e110c9cf9', './movable-ink')
register('6537b5da8f27fd20713a5ba8', './usermotion')
register('6554dc58634812f080d83a23', './canvas')
register('656f2474a919b7e6e4900265', './gleap')
register('659eb79c1141e58effa2153e', './kevel')
register('659eb601f8f615dac18db564', './aggregations-io')
register('659eb6903c4d201ebd9e2f5c', './equals')
register('66543798b2fb3cb3e9ff992c', './amazon-amc')
register('65b8e9eca1b5903a031c6378', './schematic')
register('65b8e9ae4bc3eee909e05c73', './courier')
register('65b8e9531fc2c458f50fd55d', './tiktok-offline-conversions-sandbox')
register('65b8e9108b442384abfd05f9', './tiktok-conversions-sandbox')
register('65b8e89cd96df17201b04a49', './surveysparrow')
register('65c2465d0d7d550aa8e7e5c6', './avo')
register('65c36c1e127fb2c8188a414c', './stackadapt')
register('65cb48feaca9d46bf269ac4a', './accoil-analytics')
register('65dde5755698cb0dab09b489', './kafka')
register('65e71d50e1191c6273d1df1d', './kevel-audience')
register('65f05e455b125cddd886b793', './moloco-rmp')
register('6578a19fbd1201d21f035156', './responsys')
register('65f9885371de48a7a3f6b4bf', './yotpo')
register('65f98869b73d65a27152e088', './mantle')
register('65f9888628c310646331738a', './chartmogul')
register('661e9787658d112ba31b59a7', './xtremepush')
register('661e97a161b54c61eb22ead5', './spiffy')
register('6627b0208bbe1699ca06eef8', './inleads-ai')
register('663235c8575a8ec65ccadf42', './magellan-ai')
register('664ce7bdc820c71f7e3ff031', './contentstack')
register('664ce847b3e6f19ea96b3611', './trubrics')
register('66684ba89c0523461d8bb7f3', './taboola-actions')
register('6683e1d5e37fd84efcf3bbef', './first-party-dv360')
register('668d1cb2a1dcc5ad33228d92', './angler-ai')
register('6698df634212816c561d3e6a', './aws-s3')
register('669f91bb3f2189462dddb691', './adjust')
register('66a7c28810bbaf446695d27d', './iterable-lists')
register('66b1f528d26440823fb27af9', './webhook-extensible')
register('66ba235ecfcfee29bab517ce', './dawn')
register('66ba237845b93b71bca2713e', './topsort')
register('66c492a35a05977266a4a5c4', './delivrai-activate')
register('66cc766ef4b1c152177239a0', './reddit-conversions-api')
register('66cc76e29693c9e5591bf029', './nextdoor-capi')

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
