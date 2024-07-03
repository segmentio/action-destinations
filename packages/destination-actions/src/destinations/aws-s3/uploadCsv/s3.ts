import { InvalidAuthenticationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
//Define the Interface for testing
interface Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}
// Assume role and get temporary credentials
let roleArn: string,
  roleSessionName: string,
  region = ''

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

import { v4 as uuidv4 } from '@lukeed/uuid'

// Assume role and get temporary credentials
const assumeRole = async (roleArn: string, roleSessionName: string): Promise<Credentials> => {
  const stsClient = new STSClient({ region })
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: roleSessionName
  })

  const response = await stsClient.send(command)
  if (!response.Credentials) {
    throw new Error('Failed to assume role and get temporary credentials')
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId!,
    secretAccessKey: response.Credentials.SecretAccessKey!,
    sessionToken: response.Credentials.SessionToken!
  }
}

function validateS3(payload: Payload) {
  if (!payload.iam_role_arn) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing IAM Role ARN')
  }
  if (!payload.s3_aws_bucket_name) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS S3 bucket name')
  }

  if (payload.s3_aws_folder_name) {
    if (!payload.s3_aws_folder_name.endsWith('/')) {
      throw new InvalidAuthenticationError('Selected S3 upload mode, but the folder name must end with "/"')
    }
  }

  if (!payload.s3_aws_region) {
    throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Region')
  }
}

// Function to upload a CSV content to S3
const uploadCSV = async (
  credentials: Credentials,
  fileContent: Buffer | string,
  bucketName: string,
  folderName: string,
  key: string,
  region: string
) => {
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    }
  })
  const objectKey = folderName ? `${folderName}${key}` : key
  const uploadParams = {
    Bucket: bucketName,
    Key: objectKey,
    Body: fileContent,
    ContentType: 'text/csv'
  }

  try {
    await s3Client.send(new PutObjectCommand(uploadParams))
  } catch (err) {
    throw new Error(`Non-retryable error: ${err.message}`, { cause: err, code: 400 })
  }
  return { statusCode: 200, message: 'Upload successful' }
}

// Function to get credentials
const getCredentials = async (roleArn: string, roleSessionName: string): Promise<Credentials> => {
  try {
    const credentials = await assumeRole(roleArn, roleSessionName)
    return credentials
  } catch (err) {
    throw new Error(`Non-retryable error: ${err.message}`, { cause: err, code: 400 })
  }
}

async function uploadS3(
  payload: Payload,
  filename: string,
  fileContent: Buffer
): Promise<{ statusCode: number; message: string }> {
  try {
    roleArn = payload.iam_role_arn
    roleSessionName = uuidv4()
    region = payload.s3_aws_region!
    const credentials = await getCredentials(roleArn, roleSessionName)
    const dateSuffix = new Date().toISOString().replace(/[:.]/g, '-')

    if (filename.endsWith('.csv')) {
      // Insert the date suffix before the .csv extension
      filename = filename.replace('.csv', `_${dateSuffix}.csv`)
    } else {
      // Append the date suffix followed by .csv
      filename = `${filename}_${dateSuffix}.csv`
    }

    const bucketName = payload.s3_aws_bucket_name!
    const folderName = payload.s3_aws_folder_name || ''

    await uploadCSV(credentials, fileContent, bucketName, folderName, filename, region)
    return { statusCode: 200, message: 'Upload successful' }
  } catch (err) {
    return { statusCode: 500, message: 'Upload failed' }
  }
}

export { validateS3, uploadS3 }
