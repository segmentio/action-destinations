export interface Mixpanel {
  init(token: string, config: Partial<Config>, name: string): Mixpanel;

  // For Segment page events
  track_pageview(
    properties?: Dict, // property values can be string, num, bool, array, or object
    options?: { event_name?: string | undefined }
  ): void;

  // For Segment track events
  track(
    event_name: string,
    properties?: Dict,
    optionsOrCallback?: RequestOptions | Callback,
    callback?: Callback
  ): void;

  // For Segment identify events. Note, traits go in the register call below.
  identify(unique_id?: string): any;

  // This is how we set traits...
  people: People;



  alias(alias: string, original?: string): void;
  clear_opt_in_out_tracking(options?: Partial<ClearOptOutInOutOptions>): void;
  disable(events?: string[]): void;
  get_config(prop_name?: string): any;
  get_distinct_id(): any;
  get_group(group_key: string, group_id: string): Group;
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
  set_group(
    group_key: string,
    group_ids: string | string[] | number | number[],
    callback?: Callback
  ): void;
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

export interface People {
  set(prop: Dict, callback?: Callback): void;
  set_once(prop: Dict, callback?: Callback): void;
  increment(prop: string | Dict, callback?: Callback): void;
}