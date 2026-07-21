import { PAGE_VIEW_URL_CONFIG_OPTIONS, PERSISTENCE_OPTIONS, AUTOCAPTURE_OPTIONS } from './constants'

export type PageViewUrlConfigOption = typeof PAGE_VIEW_URL_CONFIG_OPTIONS[keyof typeof PAGE_VIEW_URL_CONFIG_OPTIONS]

export type PersistenceOptions = typeof PERSISTENCE_OPTIONS[keyof typeof PERSISTENCE_OPTIONS]

export type AutocaptureOptions = typeof AUTOCAPTURE_OPTIONS[keyof typeof AUTOCAPTURE_OPTIONS]

export interface Mixpanel {
  init(token: string, config: Config, name?: string): Mixpanel

  track_pageview(
    properties?: {
      [k: string]: unknown
    },
    options?: { event_name?: string | undefined }
  ): void

  track(
    event_name: string,
    properties?: {
      [k: string]: unknown
    }
  ): void

  identify(unique_id?: string): void

  alias(alias: string, original?: string): void

  get_group(group_key: string, group_id: string): Group

  set_group(group_key: string, group_ids: string): void

  people: People
}

export interface People {
  set(prop: { [k: string]: unknown }): void
  set_once(prop: { [k: string]: unknown }): void
  increment(prop: { [k: string]: unknown }): void
}

export interface Group {
  set(prop: { [k: string]: unknown }): void
  set_once(prop: { [k: string]: unknown }): void
  union(list_name: string, values: (string | number | boolean)[]): void
}

export interface Config {
  autocapture?:
    | {
        pageview?: PageViewUrlConfigOption
        click?: boolean
        dead_click?: boolean
        input?: boolean
        rage_click?: boolean
        scroll?: boolean
        submit?: boolean
        capture_text_content?: boolean
      }
    | boolean
  cross_subdomain_cookie?: boolean
  persistence?: PersistenceOptions
  track_marketing?: boolean
  cookie_expiration?: number
  disable_persistence?: boolean
  ip?: boolean
  record_block_class?: string
  record_block_selector?: string
  record_canvas?: boolean
  record_heatmap_data?: boolean
  record_idle_timeout_ms?: number
  record_mask_text_class?: string
  record_mask_text_selectors?: string
  record_max_ms?: number
  record_min_ms?: number
  record_sessions_percent?: number
  loaded?: (instance: Mixpanel) => void
}
