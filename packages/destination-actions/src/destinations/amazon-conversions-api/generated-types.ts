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
   * Amazon Ads organizes uploaded data into datasets, which are logical groupings used to separate and categorize events from your sources. All events within a dataset will appear in Amazon Ads Data Manager under the name you provide here. New destination? We recommend providing a dataset name during initial setup. Existing destination? We strongly recommend reading the [FAQ](https://www.twilio.com/docs/segment/connections/destinations/catalog/actions-amazon-conversions-api#what-is-a-dataset-and-how-does-amazon-use-the-dataset-name) before updating your dataset name, as changes may impact your existing events.
   */
  dataSetName?: string
}
