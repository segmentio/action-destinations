
export interface People {
  set(prop: {[k: string]: unknown}): void
  set_once(prop: {[k: string]: unknown}): void
  increment(prop: {[k: string]: unknown}): void
}

export interface Group {
  set(prop: {[k: string]: unknown}): void
  set_once(prop: {[k: string]: unknown}): void
}

export interface Mixpanel {
  init(token: string, config: Partial<Config>, name: string): Mixpanel;

  // For Segment page events
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

  // For Segment identify events. Note, traits go in the register call below.
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
