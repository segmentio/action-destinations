import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { validateS3 } from './s3'
import { DELIVRAI_MIN_RECORD_COUNT } from '../properties'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { RawData, ExecuteInputRaw, ProcessDataInput } from '../operations'
import * as fs from 'fs'
import path from 'path'
import AWS from 'aws-sdk'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered (S3)',
  description: 'Uploads audience membership data to a file in S3 for Delivr.AI ingestion.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    s3_aws_access_key: {
      label: 'AWS Access Key ID',
      description: 'IAM user credentials with write permissions to the S3 bucket.',
      type: 'string'
    },
    s3_aws_secret_key: {
      label: 'AWS Secret Access Key',
      description: 'IAM user credentials with write permissions to the S3 bucket.',
      type: 'password'
    },
    s3_aws_bucket_name: {
      label: 'AWS Bucket Name',
      description: 'Name of the S3 bucket where the files will be uploaded to.',
      type: 'string'
    },
    s3_aws_region: {
      label: 'AWS Region (S3 only)',
      description: 'Region where the S3 bucket is hosted.',
      type: 'string'
    },
    audience_key: {
      label: 'Audience Key',
      description:
        'Unique ID that identifies members of an audience. A typical audience key might be client customer IDs, email addresses, or phone numbers.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    identifier_data: {
      label: 'Identifier Data',
      description: `Additional data pertaining to the user to be written to the file.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only'
    },
    unhashed_identifier_data: {
      label: 'Hashable Identifier Data',
      description: `Additional data pertaining to the user to be hashed before written to the file. Use field name **phone_number** or **email** to apply Delivr.AI's specific hashing rules.`,
      type: 'object',
      required: false,
      defaultObjectUI: 'keyvalue:only'
    },
    delimiter: {
      label: 'Delimeter',
      description: `Character used to separate tokens in the resulting file.`,
      type: 'string',
      required: true,
      default: ','
    },
    filename: {
      label: 'Filename',
      description: `Name of the CSV file to upload for Delivr.AI ingestion.`,
      type: 'string',
      required: true,
      default: { '@template': '{{properties.audience_key}}.csv' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in a batch payload. This is required for Delivr.AI audiences ingestion.',
      unsafe_hidden: true,
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 170000
    }
  },
  perform: async (request, { payload, features, rawData }: ExecuteInputRaw<Settings, Payload, RawData>) => {
    return processData({
      request,
      payloads: [payload],
      features,
      rawData: rawData ? [rawData] : []
    })
  },
  performBatch: (request, { payload, features, rawData }: ExecuteInputRaw<Settings, Payload[], RawData[]>) => {
    return processData({
      request,
      payloads: payload,
      features,
      rawData
    })
  }
}

async function processData(input: ProcessDataInput<Payload>) {
  if (input.payloads.length < DELIVRAI_MIN_RECORD_COUNT) {
    throw new PayloadValidationError(
      `received payload count below Delivr.AI's ingestion limits. expected: >=${DELIVRAI_MIN_RECORD_COUNT} actual: ${input.payloads.length}`
    )
  }

  //validateS3(input.payloads[0])
  
  const credentials = {
    accessKeyId: input.payloads[0].s3_aws_access_key,
    secretAccessKey: input.payloads[0].s3_aws_secret_key,
    region: input.payloads[0].s3_aws_region // e.g., 'us-east-1'
  };


  const bucketName = input.payloads[0].s3_aws_bucket_name;
  const objectKey = input.payloads[0].audience_key+'.csv';
 
 AWS.config.update(credentials);

// Write data to CSV
function convertArrayToCSV() {
  const inputData = input?.rawData ?  input?.rawData : [];

  const extractedData = inputData.map(obj => ({
    userId: obj.userId,
    email: obj.email
  }));

  const header = Object.keys(extractedData[0]).join(',') + '\n';

  const rows = extractedData.map(obj =>
      Object.values(obj).map(val => {
          if (typeof val === 'string') {
              // If value contains commas, wrap it with double quotes
              if (val.includes(',')) {
                  return `"${val}"`;
              } else {
                  return val;
              }
          } else {
              return val;
          }
      }).join(',')
  ).join('\n');

  return header + rows;
}

// Generate CSV content
const csvContent = convertArrayToCSV();
const csvFilePath = path.join(__dirname,`./files/${input.payloads[0].audience_key}.csv`);
console.log('local csvFilePath ', csvFilePath);
fs.writeFile(csvFilePath, csvContent, err => {
  if (err) {
      console.error('Error writing CSV file:', err);
  } else {
     // console.log('CSV file has been successfully created!');
  }
}); 


const s3 = new AWS.S3();

const params = {
    Bucket: bucketName,
    Key: objectKey,
    Body: fs.createReadStream(csvFilePath)
};

function handleDelete(filePath) {
  return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
          if (err) {
              console.error('Error while deleting file:', err);
              reject(err);
          } else {
              console.log('File deleted successfully');
              resolve('done');
          }
      });
  });
}

async function uploadToS3(params) {
  return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
          if (err) {
              console.error('Error uploading to S3:', err);
              void handleDelete(csvFilePath);
              reject(err);
          } else {
              console.log('CSV file uploaded to S3:', data.Location);
              void handleDelete(csvFilePath);
              resolve(data);
          }
      });
  });
}

try{
  const data = await uploadToS3(params);
  return data;

  //  return await s3.upload(params , (err, data) => {
  //       if (err) { 
  //           console.error('Error uploading to S3:', err);
  //           fs.unlink(csvFilePath, (err) => {
  //             if (err) {
  //               console.error('Error while deleting file:', err);
  //               return;
  //             }
  //             console.log('File deleted successfully');
  //           });
  //           return err;
  //       } else {
  //           console.log('CSV file uploaded to S3:', data.Location);
  //           fs.unlink(csvFilePath, (err) => {
  //             if (err) {
  //               console.error('Error while deleting file:', err);
  //               return;
  //             }
  //             console.log('File deleted successfully');
  //           });
  //           return data;
  //       }
  //   })
}catch (err) {
  console.error('Error while uploading file:', err.message);
  return err;
} finally {
  // Disconnect from the SFTP server
 console.log('Disconnected from SFTP server');
}
  // const { filename, fileContents } = generateFile(input.payloads)

  // if (input.features && input.features[DELIVRAI_LEGACY_FLOW_FLAG_NAME] === true) {
  //   //------------
  //   // LEGACY FLOW
  //   // -----------
  //   return uploadS3(input.payloads[0], filename, fileContents, input.request)
  // } else {
  //   //------------
  //   // AWS FLOW
  //   // -----------
  //   return sendEventToAWS(input.request, {
  //     audienceComputeId: input.rawData?.[0].context?.personas?.computation_id,
  //     uploadType: 's3',
  //     filename,
  //     fileContents,
  //     s3Info: {
  //       s3BucketName: input.payloads[0].s3_aws_bucket_name,
  //       s3Region: input.payloads[0].s3_aws_region,
  //       s3AccessKeyId: input.payloads[0].s3_aws_access_key,
  //       s3SecretAccessKey: input.payloads[0].s3_aws_secret_key
  //     }
  //   })
  // }
}

export default action
