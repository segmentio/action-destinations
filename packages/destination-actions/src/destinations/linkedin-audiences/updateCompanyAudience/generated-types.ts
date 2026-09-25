// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The company identifiers to add to or remove from the LinkedIn DMP Company Segment. At least one of 'Company Name', 'Company Domain', 'Company Email Domain', 'LinkedIn Company ID' or 'LinkedIn Company Page URL' is required, and providing more than one is recommended. Every identifier that meets the format for its field is sent, so the more LinkedIn receives, the better its chance of matching the company.
   */
  identifiers: {
    /**
     * The company's name to send to LinkedIn, e.g. 'Microsoft'.
     */
    companyName?: string
    /**
     * The company's website domain, e.g. 'microsoft.com'. A domain, an email address or a page URL are all accepted, and only the domain part is sent. A value that is not a fully qualified domain, such as a company name, is not sent.
     */
    companyDomain?: string
    /**
     * The company's email domain, which is sometimes different from its website domain, e.g. 'microsoft.com'. A domain, an email address or a page URL are all accepted, and only the domain part is sent. A value that is not a fully qualified domain, such as a company name, is not sent.
     */
    companyEmailDomain?: string
    /**
     * The company's LinkedIn organization ID or organization URN, e.g. '1035' or 'urn:li:organization:1035'. A bare ID is automatically converted to a URN before being sent to LinkedIn.
     */
    linkedInCompanyId?: string
    /**
     * The company's page on LinkedIn, as a full URL including the scheme, e.g. 'https://www.linkedin.com/company/microsoft'. A value without a scheme fails validation and the event is not sent. See the [Company Identifiers documentation](https://segment.com/docs/connections/destinations/catalog/actions-linkedin-audiences/#company-identifiers) for details.
     */
    companyPageUrl?: string
  }
  /**
   * Send additional company details, such as city and country, to help LinkedIn match the company. Only one record's values are sent per company, so make sure they are consistent across the records you sync. See the [Company Traits documentation](https://segment.com/docs/connections/destinations/catalog/actions-linkedin-audiences/#company-traits) for details.
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
   * Whether the company should be added to or removed from the LinkedIn DMP Company Segment. This is a fixed setting for the mapping, not derived from Audience membership: a mapping set to Add only ever adds companies, and one set to Remove only ever removes them.
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
