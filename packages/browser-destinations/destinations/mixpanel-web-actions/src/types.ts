import { PAGE_VIEW_URL_CONFIG_OPTIONS, PERSISTENCE_OPTIONS } from './constants'

export type PageViewUrlConfigOption = typeof PAGE_VIEW_URL_CONFIG_OPTIONS[keyof typeof PAGE_VIEW_URL_CONFIG_OPTIONS]

export type PersistenceOptions = typeof PERSISTENCE_OPTIONS[keyof typeof PERSISTENCE_OPTIONS]

export interface People {
  set(prop: {[k: string]: unknown}): void
  set_once(prop: {[k: string]: unknown}): void
  increment(prop: {[k: string]: unknown}): void
}

export interface Group {
  set(prop: {[k: string]: unknown}): void
  set_once(prop: {[k: string]: unknown}): void
  union(list_name: string, values: (string | number | boolean)[]): void
}

export interface Config {
  autocapture?: {
    pageview?: PageViewUrlConfigOption
    click?: boolean
    dead_click?: boolean
    input?: boolean
    rage_click?: boolean
    scroll?: boolean
    submit?: boolean
    capture_text_content?: boolean
  } | boolean,
  cross_subdomain_cookie?: boolean
  persistence?: PersistenceOptions,
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
}

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

  people: People

  get_group(group_key: string, group_id: string): Group

  set_group( group_key: string, group_ids: string): void

  alias(alias: string, original?: string): void;

  clear_opt_in_out_tracking(options?: Partial<ClearOptOutInOutOptions>): void;
  disable(events?: string[]): void;
  get_config(prop_name?: string): any;
  get_distinct_id(): any;

  get_property(property_name: string): any;
  has_opted_in_tracking(options?: Partial<HasOptedInOutOptions>): boolean;
  has_opted_out_tracking(options?: Partial<HasOptedInOutOptions>): boolean;


  opt_in_tracking(options?: Partial<InTrackingOptions>): void;
  opt_out_tracking(options?: Partial<OutTrackingOptions>): void;
  push(item: PushItem): void;
  register(
    props: Dict,
    days_or_options?: number | Partial<RegisterOptions>
  ): void;
  register_once(
    props: Dict,
    default_value?: any,
    days_or_options?: number | Partial<RegisterOptions>
  ): void;
  remove_group(
    group_key: string,
    group_ids: string | string[] | number | number[],
    callback?: Callback
  ): void;
  reset(): void;
  set_config(config: Partial<Config>): void;


  time_event(event_name: string): void;

  track_forms(
    query: Query,
    event_name: string,
    properties?: Dict | (() => void)
  ): void;
  track_links(
    query: Query,
    event_name: string,
    properties?: Dict | (() => void)
  ): void;

  track_with_groups(
    event_name: string,
    properties: Dict,
    groups: Dict,
    callback?: Callback
  ): void;
  unregister(property: string, options?: Partial<RegisterOptions>): void;

  start_session_recording(): void;
  stop_session_recording(): void;
  get_session_recording_properties(): { $mp_replay_id?: string } | {};
}
