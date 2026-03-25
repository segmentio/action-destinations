// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * IAM Role ARN with permissions to write to the Kinesis stream. Format: arn:aws:iam::account-id:role/role-name
   */
  iam_role_arn: string
  /**
   * The External ID for the IAM role. Generate a secure string and treat it like a password.
   */
  iam_external_id: string
}
