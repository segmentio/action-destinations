// import generateS3RequestOptions from '../../../lib/AWS/s3'
import { InvalidAuthenticationError } from '@segment/actions-core'
import { Payload } from './generated-types'
// import AWS from 'aws-sdk';

// import { S3Client } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
// import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

// Assume role and get temporary credentials
let roleArn: string,
  roleSessionName: string,
  region = ''
//'arn:aws:iam::058449100246:role/mp-s3-anthony-hung-2', roleSessionName = 'your-session-name2'
//const region = "us-west-2"; // Change to your AWS region

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
// import { FeatureSetDefaults_FeatureSetEditionDefault } from '@bufbuild/protobuf';

import { v4 as uuidv4 } from '@lukeed/uuid'

// Assume role and get temporary credentials
const assumeRole = async (roleArn: string, roleSessionName: string) => {
  const stsClient = new STSClient({ region })
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: roleSessionName
  })

  const response = await stsClient.send(command)
  if (!response.Credentials) {
    throw new Error('Failed to assume role and get temporary credentials')
  }
  console.log('Assumed role and got temporary credentials', response)
  return {
    accessKeyId: response.Credentials.AccessKeyId,
    secretAccessKey: response.Credentials.SecretAccessKey,
    sessionToken: response.Credentials.SessionToken
  }
}

function validateS3(payload: Payload) {
  // if (!payload.s3_aws_access_key) {
  //   throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Access Key')
  // }

  // if (!payload.s3_aws_secret_key) {
  //   throw new InvalidAuthenticationError('Selected S3 upload mode, but missing AWS Secret Key')
  // }
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

// const jsonPayload = { audienceKey: true };
// const bucketName = "anthony-hung"; // replace with your bucket name
// const key = "abcd.json"; // replace with your desired key in S3

// Function to upload a CSV content to S3
const uploadCSV = async (credentials, fileContent, bucketName, folderName, key, region) => {
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    }
  })

  const objectKey = `${folderName}${key}`

  const uploadParams = {
    Bucket: bucketName,
    Key: objectKey,
    Body: fileContent,
    ContentType: 'text/csv'
  }

  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams))
    console.log('Upload Success', data)
  } catch (err) {
    console.error('Error', err)
  }
  return { statusCode: 200, message: 'Upload successful' }
}

// Function to get credentials
const getCredentials = async (roleArn: string, roleSessionName: string) => {
  try {
    const credentials = await assumeRole(roleArn, roleSessionName)
    console.log('Assumed role and got temporary credentials', credentials)
    return credentials
  } catch (err) {
    console.error('Error assuming role', err)
    throw err
  }
}

async function uploadS3(
  payload: Payload,
  filename: string,
  fileContent: Buffer //,
  // request: <Data = unknown>(url: string, options?: RequestOptions) => Promise<ModifiedResponse<Data>>
): Promise<{ statusCode: number; message: string }> {
  try {
    roleArn = payload.iam_role_arn
    roleSessionName = uuidv4()
    region = payload.s3_aws_region
    const credentials = await getCredentials(roleArn, roleSessionName)
    console.log('Credentials outside async block:', credentials)

    if (!filename.endsWith('.csv')) {
      filename = filename + '_' + new Date().toISOString() + '.csv'
    } else {
      filename = filename + '_' + new Date().toISOString()
    }

    await uploadCSV(credentials, fileContent, payload.s3_aws_bucket_name, payload.s3_aws_folder_name, filename, region)
    return { statusCode: 200, message: 'Upload successful' }
  } catch (err) {
    console.error('Error', err)
    return { statusCode: 500, message: 'Upload failed' }
  }
}

// async function uploadS3(
//   payload: Payload,
//   filename: string,
//   fileContent: Buffer,
//   request: <Data = unknown>(url: string, options?: RequestOptions) => Promise<ModifiedResponse<Data>>
// ) {
//   (async () => {
//     try {
//       roleArn = payload.iam_role_arn as string;
//       roleSessionName = uuidv4();
//       region = payload.s3_aws_region as string;
//       const credentials = await getCredentials(roleArn, roleSessionName);
//       // Now you can access credentials outside of the asynchronous operation
//       console.log("Credentials outside async block:", credentials);

//       // Proceed with CSV upload or other operations
//       if (!filename.endsWith('.csv')) {
//         filename = filename + '_' + new Date().toISOString() + '.csv';
//       } else {
//         filename = filename + '_' + new Date().toISOString();
//       }
//       await uploadCSV(credentials, fileContent, payload.s3_aws_bucket_name, filename, region);
//       return 'Upload successful';
//     } catch (err) {
//       console.error("Error", err);
//       return 'Upload successful';
//     }
//   })();

export { validateS3, uploadS3 }
