import type { BrowserDestinationDefinition } from '../lib/browser-destinations'
declare type MetadataId = string
export interface ManifestEntry {
  definition: BrowserDestinationDefinition<any, any>
  directory: string
  path: string
}
export declare const manifest: Record<MetadataId, ManifestEntry>
export {}
