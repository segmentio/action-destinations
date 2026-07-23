// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Mailchimp Marketing API key. Used as the password for HTTP Basic Auth. Find it under Account > Extras > API keys.
   */
  apiKey: string
  /**
   * The datacenter prefix for your Mailchimp account (e.g. us6). If left blank, it is resolved automatically from the suffix of your API key.
   */
  dataCenter?: string
  /**
   * The default Mailchimp Audience (List) ID to send events to. Find it under Audience > Settings > Audience name and defaults ("Audience ID").
   */
  audienceId: string
}
