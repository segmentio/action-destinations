// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Region for API Endpoint, either NA, EU, FE.
   */
  region: string
  /**
   * Your Amazon Advertiser Account ID. This must be a numeric value. Use Amazon DSP CFID and not Entity ID.
   */
  advertiserId: string
  /**
   * Amazon Ads uses Dataset Name to group events from specific sources. When setting up this destination for the first time, Amazon recommends reading [this FAQ](https://www.twilio.com/docs/segment/connections/destinations/catalog/actions-amazon-conversions-api#what-is-a-dataset-and-how-does-amazon-use-the-dataset-name).
   */
  dataSetName?: string
}
