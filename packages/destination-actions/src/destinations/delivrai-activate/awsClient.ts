import { v4 as uuidv4 } from '@lukeed/uuid'
import aws4 from 'aws4'
import { Client as ClientSFTP } from './audienceEnteredSftp/sftp'
import { RequestClient, InvalidAuthenticationError } from '@segment/actions-core'
// import { getAWSCredentialsFromEKS, AWSCredentials } from '../../lib/AWS/sts'

import { ACTION_SLUG, DELIVRAI_SFTP_SERVER, DELIVRAI_SFTP_PORT } from './properties'

interface SendToAWSRequest {
  audienceComputeId?: string
  uploadType: 's3' | 'sftp'
  filename: string
  fileContents: Buffer
  sftpInfo?: {
    sftpUsername?: string
    sftpPassword?: string
    sftpFolderPath?: string
  }
  s3Info?: {
    s3BucketName?: string
    s3Region?: string
    s3AccessKeyId?: string
    s3SecretAccessKey?: string
  }
}

interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
}

interface UploadToAWSS3Input {
  request: RequestClient
  bucketName: string
  region: string
  fileContentType: string
  filePath: string
  fileContent: Buffer | string
  awsCredentials: AWSCredentials
}


interface UploadToAWSSFTPInput {
  request: RequestClient
  sftpUsername: string
  sftpPassword: string
  fileContentType: string
  filePath: string
  fileContent: Buffer | string
}

export const sendEventToAWS = async (request: RequestClient, input: SendToAWSRequest) => {
  // Compute file path and message dedupe id
  // Each advertiser and segment can eventually have multiple data drops, we use uuid create unique files
  const uuidValue = uuidv4()
  const userdataFilePath = `/${ACTION_SLUG}/${uuidValue}.csv`
  
  if (input.uploadType === 'sftp') {
  
    const filePath = `${input?.sftpInfo?.sftpFolderPath || ''}/${uuidValue}.csv`;
    await uploadToAWSSFTP({
      request,
      sftpUsername: input?.sftpInfo?.sftpUsername || '',
      sftpPassword: input?.sftpInfo?.sftpPassword || '',
      fileContentType: 'text/csv',
      filePath: filePath,
      fileContent: input.fileContents
    });
  } else {
    const awsCredentials = {
      accessKeyId: input.s3Info?.s3AccessKeyId || '',
      secretAccessKey: input.s3Info?.s3SecretAccessKey || ''
     };
     
      // Upload user data to the S3 bucket
      await uploadToAWSS3({
        request,
        bucketName: input?.s3Info?.s3BucketName || '',
        region: input?.s3Info?.s3Region || '',
        fileContentType: 'text/csv',
        filePath: userdataFilePath,
        fileContent: input.fileContents,
        awsCredentials: awsCredentials
      })
    
  }

}

async function uploadToAWSS3(input: UploadToAWSS3Input) {
  // Sign the AWS request
  const s3UploadRequest = aws4.sign(
    {
      host: `${input.bucketName}.s3.${input.region}.amazonaws.com`,
      path: input.filePath,
      body: input.fileContent,
      method: 'PUT',
      service: 's3',
      region: input.region,
      headers: {
        'Content-Type': input.fileContentType,
        Accept: 'application/json'
      }
    },
    {
      accessKeyId: input.awsCredentials.accessKeyId,
      secretAccessKey: input.awsCredentials.secretAccessKey,
    }
  )



  // Verify Signed Headers
  if (!s3UploadRequest.headers || !s3UploadRequest.method || !s3UploadRequest.host || !s3UploadRequest.path) {
    throw new InvalidAuthenticationError('Unable to generate signature header for AWS S3 request.')
  }

  // Upload file to S3
  return input.request(`https://${input.bucketName}.s3.${input.region}.amazonaws.com${input.filePath}`, {
    method: 'PUT',
    body: s3UploadRequest.body,
    headers: s3UploadRequest.headers as Record<string, string>
  })
}


async function uploadToAWSSFTP(input: UploadToAWSSFTPInput) {
    // Sign the AWS request
    const sftpClient = new ClientSFTP()
    const sftpConfig = {
      host: DELIVRAI_SFTP_SERVER,
      port: DELIVRAI_SFTP_PORT, // Usually 22
      username: input.sftpUsername,
      password: input.sftpPassword
    };

    await sftpClient.connect(sftpConfig);
    const fileContent = input.fileContent;
    const filePath = input.filePath;
    return sftpClient.put(fileContent, filePath);
}
