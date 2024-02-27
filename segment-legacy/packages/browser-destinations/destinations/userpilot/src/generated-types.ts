// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Userpilot app token, you can find it in the [Userpilot installation](https://run.userpilot.io/installation) dashboard.
   */
  token: string
  /**
   * By default, Userpilot would use a service discovery mechanism to determine the API endpoint to connect to. If you are using a proxy or a firewall, you can specify the API endpoint here.
   */
  endpoint?: string
  /**
   * By default, Segment will load the Userpilot JS snippet onto the page. If you are already loading the Userpilot JS onto the page then disable this setting and Segment will detect the Userpilot JS on the page
   */
  shouldSegmentLoadSDK: boolean
}
