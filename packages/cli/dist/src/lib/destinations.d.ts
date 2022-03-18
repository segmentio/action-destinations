import type { ManifestEntry as BrowserManifest, BrowserDestinationDefinition } from '@segment/browser-destinations'
import type { DestinationDefinition as CloudDestinationDefinition } from '@segment/actions-core'
import type { ManifestEntry as CloudManifest } from '@segment/action-destinations'
export declare type DestinationDefinition = CloudDestinationDefinition | BrowserDestinationDefinition
export declare function loadDestination(filePath: string): Promise<null | DestinationDefinition>
export declare const getManifest: () => Record<string, CloudManifest | BrowserManifest>
export declare function hasOauthAuthentication(definition: DestinationDefinition): boolean
