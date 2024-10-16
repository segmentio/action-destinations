// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * You will find this information in the event snippet for your conversion action, for example `send_to: AW-CONVERSION_ID/AW-CONVERSION_LABEL`. In the sample snippet, AW-CONVERSION_ID stands for the conversion ID unique to your account. Enter the conversion ID, without the AW- prefix. **Required if you are using a mapping that sends data to the legacy Google Enhanced Conversions API (i.e. Upload Enhanced Conversion (Legacy) Action).**
   */
  conversionTrackingId?: string
  /**
   * ID of your Google Ads Account. This should be 10-digits and in XXX-XXX-XXXX format. **Required if you are using a mapping that sends data to the Google Ads API.**
   */
  customerId?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Mark true if you are using uploadCallConversion, uploadClickConversion or uploadConversionAdjustment. If you plan to use userLists alone or in combination with the others, mark as false.
   */
  supports_conversions?: boolean
  /**
   * Customer match upload key types. Required if you are using UserLists. Not used by the other actions.
   */
  external_id_type?: string
  /**
   * A string that uniquely identifies a mobile application from which the data was collected. Required if external ID type is mobile advertising ID
   */
  app_id?: string
}
