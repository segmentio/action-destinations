import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import { validateSFTP, Client as ClientSFTP } from './sftp'
// import { generateFile } from '../operations'
// import { sendEventToAWS } from '../awsClient'
import { DELIVRAI_MIN_RECORD_COUNT,DELIVRAI_SFTP_SERVER, DELIVRAI_SFTP_PORT } from '../properties'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { RawData, ExecuteInputRaw, ProcessDataInput } from '../operations'
import * as fs from 'fs'
import path from 'path'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Audience Entered (SFTP)',
  description: 'Uploads audience membership data to a file through SFTP for Delivr.AI ingestion.',
  defaultSubscription: 'event = "Audience Entered"',
  fields: {
    sftp_username: {
      label: 'Username',
      description: 'User credentials for establishing an SFTP connection with Delivr.AI.',
      type: 'string'
    },
    sftp_password: {
      label: 'Password',
      description: 'User credentials for establishing an SFTP connection with Delivr.AI.',
      type: 'password'
    },
    sftp_folder_path: {
      label: 'Folder Path',
      description:
        'Path within the Delivr.AI SFTP server to upload the files to. This path must exist and all subfolders must be pre-created.',
      type: 'string',
      // default: { '@template': '' },
      format: 'uri-reference'
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
      default: { '@template': '{{properties.audience_key}}_PII.csv' }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch data',
      description: 'Receive events in a batch payload. This is required for Delivr.AI audiences ingestion.',
      required: true,
      unsafe_hidden: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      unsafe_hidden: true,
      default: 50000
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

 // validateSFTP(input.payloads[0])

  // const { filename, fileContents } = generateFile(input.payloads

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
  const outputPath = path.join(__dirname,`./files/${input.payloads[0].filename}.csv`);

  console.log('local csvFilePath ', outputPath);
  fs.writeFile(outputPath, csvContent, err => {
    if (err) {
        console.error('Error writing CSV file:', err);
    } else {
       // console.log('CSV file has been successfully created!');
    }
  }); 

  // const filename = `${input.payloads[0].audience_key}.csv`;
  // const fileContents = fs.readFileSync(outputPath);

//Input commented for by passing if check by sunil 
  // if (input.features && input.features[DELIVRAI_LEGACY_FLOW_FLAG_NAME] === true) {
    if (input) {
    //------------
    // LEGACY FLOW
    // -----------
    const sftpClient = new ClientSFTP()
    const sftpConfig = {
      host: DELIVRAI_SFTP_SERVER,
      port: DELIVRAI_SFTP_PORT, // Usually 22
      username: input.payloads[0].sftp_username,
      password: input.payloads[0].sftp_password
  };
  try{
    const response = await sftpClient.connect(sftpConfig);
    console.log('Connected to SFTP server' , response);
    const fileData = fs.createReadStream(outputPath);
    const remoteFileName = path.basename(outputPath);
   // console.log(fileData);
    const remoteDirectory = input.payloads[0].sftp_folder_path;
    //console.log(`${remoteDirectory}/${remoteFileName}`);
    // Upload the file to the remote directory
    fs.unlink(outputPath, (err) => {
      if (err) {
        console.error('Error while deleting file:', err);
        return;
      }

    });
    return await sftpClient.put(fileData, `${remoteDirectory}/${remoteFileName}`);
    
  }catch (err) {
    console.error('Error while uploading file:', err.message);
    fs.unlink(outputPath, (err) => {
      if (err) {
        console.error('Error while deleting file:', err);
        return;
      }
    });
  } finally {
      // Disconnect from the SFTP server
      await sftpClient.end();
      console.log('Disconnected from SFTP server');
  }
   // return uploadSFTP(sftpClient, input.payloads[0], filename, fileContents)
  } else {
    //------------
    // AWS FLOW
    // -----------
    // return sendEventToAWS(input.request, {
    //   audienceComputeId: input.rawData?.[0].context?.personas?.computation_id,
    //   uploadType: 'sftp',
    //   filename,
    //   fileContents,
    //   sftpInfo: {
    //     sftpUsername: input.payloads[0].sftp_username,
    //     sftpPassword: input.payloads[0].sftp_password,
    //     sftpFolderPath: input.payloads[0].sftp_folder_path
    //   }
    // })
  }
}

export default action
