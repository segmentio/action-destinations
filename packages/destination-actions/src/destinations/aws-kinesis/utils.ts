export const validateIamRoleArnFormat = (arn: string): boolean => {
  const iamRoleArnRegex = /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_\-/]+$/
  return iamRoleArnRegex.test(arn)
}

export const sendDataToKinesis = async (_settings: Settings, _payload: Payload[]): Promise<void> => {
  // Implementation for sending data to AWS Kinesis goes here.
  // This is a placeholder function.
}
