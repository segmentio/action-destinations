// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The ARN of the IAM role to assume for Kinesis access. Format: arn:aws:iam::<account-id>:role/<role-name>. Must have kinesis:PutRecord and kinesis:PutRecords permissions.
   */
  iamRoleArn: string
  /**
   * The external ID for cross-account role assumption. Used as a shared secret between Segment and the customer's IAM trust policy.
   */
  iamExternalId: string
}
