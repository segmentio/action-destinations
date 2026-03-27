// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The ARN of the IAM Role to assume for sending data to Kinesis.
   */
  iamRoleArn: string
  /**
   * The external ID to use when assuming the IAM Role. Generate a secure string and treat it like a password.  This is often used as an additional security measure.
   */
  iamExternalId: string
}
