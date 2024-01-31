// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The CIO-Delivery-ID from the message that you want to associate the metric with.
   */
  delivery_id: string
  /**
   * The metric you want to report back to Customer.io. Not all metrics are available for all channels. Please refer to the [documentation](https://customer.io/docs/api/track/#operation/metrics) for more information.
   */
  metric: string
  /**
   * Information about who the message was delivered to.
   *         The value of this field depends on the channel the message was sent to.
   *         - For email, this is the email address.
   *         - For SMS, this is the phone number.
   *         - For mobile push, this is the device token.
   */
  recipient?: string
  /**
   * For metrics indicating a failure, this field provides information for the failure.
   */
  reason?: string
  /**
   * For click metrics, this is the link that was clicked.
   */
  href?: string
  /**
   * For In-App messages, this is the name of the action that was clicked.
   */
  action_name?: string
  /**
   * For In-App messages, this is the value of the action that was clicked.
   */
  action_value?: string
  /**
   * A timestamp of when the metric event took place. Default is when the event was triggered.
   */
  timestamp?: string | number
}
