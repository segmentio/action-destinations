import type { Analytics, Context, Plugin } from '@segment/analytics-next'
import type {
  BaseDefinition,
  BaseActionDefinition,
  ExecuteInput,
  JSONLikeObject,
  GlobalSetting
} from '@segment/actions-core'
export declare type ActionInput<Settings, Payload> = ExecuteInput<Settings, Payload> & {
  analytics: Analytics
  context: Context
}
export interface BrowserActionDefinition<Settings, Client, Payload = any> extends BaseActionDefinition {
  perform: (client: Client, data: ActionInput<Settings, Payload>) => Promise<unknown> | unknown
  platform: 'web'
  lifecycleHook?: Plugin['type']
}
export interface BrowserDestinationDependencies {
  loadScript: (src: string, attributes?: Record<string, string>) => Promise<HTMLScriptElement>
  resolveWhen: (condition: () => boolean, timeout?: number) => Promise<void>
}
export declare type InitializeOptions<Settings> = {
  settings: Settings
  analytics: Analytics
}
export interface BrowserDestinationDefinition<Settings = unknown, Client = unknown> extends BaseDefinition {
  mode: 'device'
  initialize: (options: InitializeOptions<Settings>, dependencies: BrowserDestinationDependencies) => Promise<Client>
  settings?: Record<string, GlobalSetting>
  actions: Record<string, BrowserActionDefinition<Settings, Client>>
}
export interface Subscription {
  partnerAction: string
  name: string
  enabled: boolean
  subscribe: string
  mapping: JSONLikeObject
}
