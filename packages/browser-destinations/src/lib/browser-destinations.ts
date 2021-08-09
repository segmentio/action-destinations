import type { Analytics, Context, Plugin } from '@segment/analytics-next'
import type {
  BaseDefinition,
  BaseActionDefinition,
  ExecuteInput,
  JSONLikeObject,
  InputField
} from '@segment/actions-core'

export type ActionInput<Settings, Payload> = ExecuteInput<Settings, Payload> & {
  analytics: Analytics
  context: Context
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BrowserActionDefinition<Settings, Client, Payload = any> extends BaseActionDefinition {
  /** The operation to perform when this action is triggered */
  perform: (client: Client, data: ActionInput<Settings, Payload>) => Promise<unknown> | unknown

  /**
   * The target platform for the action
   */
  platform: 'web'

  /** Which step in the Analytics.js lifecycle this action should run */
  lifecycleHook?: Plugin['type']
}

export interface BrowserDestinationDependencies {
  loadScript: (src: string, attributes?: Record<string, string>) => Promise<HTMLScriptElement>
  resolveWhen: (condition: () => boolean, timeout?: number) => Promise<void>
}

export type InitializeOptions<Settings> = { settings: Settings; analytics: Analytics }

export interface BrowserDestinationDefinition<Settings = unknown, Client = unknown> extends BaseDefinition {
  mode: 'device'

  /**
   * The function called when the destination has loaded and is ready to be initialized
   * Typically you would configure an SDK or API client here.
   * The return value is injected to your actions as the `client`
   */
  initialize: (options: InitializeOptions<Settings>, dependencies: BrowserDestinationDependencies) => Promise<Client>

  /**
   * Top-level settings that should be available across all actions
   * This is often where you would put initialization settings,
   * SDK keys, API subdomains, etc.
   */
  settings?: Record<string, InputField>

  /** Actions */
  actions: Record<string, BrowserActionDefinition<Settings, Client>>
}

export interface Subscription {
  partnerAction: string
  name: string
  enabled: boolean
  subscribe: string
  mapping: JSONLikeObject
}
