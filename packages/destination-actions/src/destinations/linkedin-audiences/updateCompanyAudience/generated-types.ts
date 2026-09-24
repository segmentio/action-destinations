// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The company identifiers to add to or remove from the LinkedIn DMP Company Segment. At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required. When more than one is provided, all of them are sent to LinkedIn to improve the match rate.
   */
  identifiers: {
    /**
     * The company's name to send to LinkedIn, e.g. 'Microsoft'.
     */
    companyName?: string
    /**
     * The company's website domain to send to LinkedIn, e.g. 'microsoft.com'.
     */
    companyDomain?: string
    /**
     * The company's email domain, which is sometimes different from its website domain, e.g. 'microsoft.com'. If a full email address is provided, only the domain part is sent.
     */
    companyEmailDomain?: string
    /**
     * The company's LinkedIn organization ID or organization URN, e.g. '1035' or 'urn:li:organization:1035'. A bare ID is automatically converted to a URN before being sent to LinkedIn.
     */
    linkedInCompanyId?: string
    /**
     * The company's LinkedIn page URL, e.g. 'linkedin.com/company/microsoft'. Any query string or fragment, such as the tracking parameters a browser adds when the URL is copied, is removed. Values longer than 100 characters are not sent, as LinkedIn rejects them.
     */
    companyPageUrl?: string
  }
  /**
   * Send additional company details, such as city and country, to help LinkedIn match the company. Leave this off when syncing a user-based Engage Audience: several users can belong to the same company, their profiles can disagree on these details, and only one of them is sent. Which one is not stable, so the values sent may change between syncs.
   */
  send_company_traits?: boolean
  /**
   * Additional company details sent to LinkedIn to help it match the company. Only used when "Send Company Traits" is enabled. A value that breaches a LinkedIn length or format limit is left out of the request rather than shortened.
   */
  company_traits?: {
    /**
     * The company's industries, as free text. Accepts either a list or a single comma-separated value, e.g. 'software, technology'. LinkedIn accepts at most 3; any beyond that are not sent. Entries longer than 50 characters are not sent.
     */
    industries?: string[]
    /**
     * The company's city, e.g. 'Seattle'. Values longer than 50 characters are not sent.
     */
    city?: string
    /**
     * The company's state or province, e.g. 'WA'. Values longer than 50 characters are not sent.
     */
    state?: string
    /**
     * The company's country as a two-letter ISO 3166-1 alpha-2 code, e.g. 'US' or 'DE'. Lowercase codes are accepted and upper-cased. A country name, or a code that is not an ISO one, is not sent. Note the code for the United Kingdom is 'GB', not 'UK'.
     */
    country?: string
    /**
     * The company's postal code, e.g. '98101'. Values longer than 20 characters are not sent.
     */
    postalCode?: string
    /**
     * The company's stock ticker symbol, e.g. 'MSFT'. Values longer than 5 characters are not sent.
     */
    stockSymbol?: string
  }
  /**
   * Whether the company should be added to or removed from the LinkedIn DMP Company Segment.
   */
  dmp_company_action: string
  /**
   * Choose "Engage or Reverse ETL" when the Audience is configured in Engage or Reverse ETL. If connecting from a Connections Source, for example a node.js Source, select Connections, then provide a name for your Segment.
   */
  audience_source: string
  /**
   * The name of the LinkedIn DMP Company Segment to sync to. Used only when Audience Source is "Connections". If a segment with this name does not already exist, it will be created in LinkedIn.
   */
  segment_name?: string
  /**
   * The computation key used to identify the LinkedIn DMP Company Segment. Used only when Audience Source is "Engage or Reverse ETL".
   */
  computation_key?: string
  /**
   * Enable batching of requests to the LinkedIn DMP Company Segment.
   */
  enable_batching?: boolean
  /**
   * Maximum number of companies to include in each batch. LinkedIn accepts up to 5000 per request.
   */
  batch_size?: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
