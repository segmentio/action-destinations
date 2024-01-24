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
