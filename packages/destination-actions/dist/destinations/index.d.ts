import type { DestinationDefinition } from '@segment/actions-core'
import { Destination } from '@segment/actions-core'
declare type MetadataId = string
export interface ManifestEntry {
  definition: DestinationDefinition<any>
  directory: string
  path: string
}
export declare const destinations: Record<string, DestinationDefinition>
export declare const manifest: Record<MetadataId, ManifestEntry>
export declare function getDestinationById(id: string): Destination | null
export declare function getDestinationByIdOrKey(idOrPathKey: string): Promise<Destination | null>
export {}
