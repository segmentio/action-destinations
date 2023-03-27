// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique key obtained after signup to API Dashboard link (https://api-dashboard.getambee.com)
   */
  apiKey: string
  /**
   * Latitude of the place to search
   */
  lat: number
  /**
   * Longitude of the place to search
   */
  lng: number
  /**
   * Possible values 'true' or 'false'. Defaults to 'false'. Returns sub species level risk evaluation for regions that currently support sub species data
   */
  speciesRisk?: boolean
}
