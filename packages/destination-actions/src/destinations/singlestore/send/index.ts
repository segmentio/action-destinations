import { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { GetDatabaseJSON } from '../types'
import { getDatabaseURL, clientId, prodBrokers, stageBrokers, xSecurityKey } from '../const'
import { Kafka, ProducerRecord, Partitioners, KafkaConfig, KafkaJSError } from 'kafkajs'
import { createHash } from 'crypto'  
import { encryptText } from '../util'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to Singlestore.',
  fields: {
    database: {
      label: 'Database',
      description: 'The name of the SingleStore database to send data to.',
      type: 'string',
      required: true,
      dynamic: true
    },
    message: {
      label: 'Message',
      description: 'The complete event payload.',
      type: 'object',
      required: true,
      default: {
        '@path': '$.'
      }
    }
  },
  dynamicFields: {
    database: async (request, { settings, /*subscriptionMetadata*/ }): Promise<DynamicFieldResponse> => {

        const databaseUri = `${settings.username}@${settings.host}:${settings.port}/${settings.dbName}`;
        const destinationId = createHash('sha256').update(databaseUri).digest('hex');
  

        const json: GetDatabaseJSON = {
          destinationIdentifier: destinationId
            // map request body here
        }

        console.log(`[dynamicFields.database] Getting for ${destinationId}`);
        try {
          const response = await request<GetDatabaseJSON>(getDatabaseURL, {
              method: 'POST',
              headers: {
                "x-security-key": xSecurityKey
              }, 
              json
          })
  
          console.log(response);

        } catch (err: any) {
          //console.log(err);
          //console.log(err.response);
          return {
            choices: [],
            nextPage: '',
            error: {
              message: err.response?.data.error.message ?? 'Unknown error',
              code: err.response?.data.error.code ?? 'Unknown error'
            }
          }
        }

        return Promise.resolve({
            choices: [{
                label: settings.dbName,
                value: settings.dbName
            }]
        } as DynamicFieldResponse)
    }
  },
  perform: async (_, {payload, settings}) => {
    
    const databaseUri = `${settings.username}@${settings.host}:${settings.port}/${settings.dbName}`;
    const destinationId = createHash('sha256').update(databaseUri).digest('hex');

    console.log(`Database Uri: ${databaseUri}`);
    console.log(`DestinationId: ${destinationId}`);

    const kafkaTopic = createHash('sha256').update(destinationId).digest('hex')
    const kafkaUsername = createHash('sha256').update(`${destinationId}_user`).digest('hex'); //.substring(0, 12)
    const kafkaPassword = await encryptText(kafkaUsername);

    console.log(`[perform] About to connect and then send data...`);
    console.log(`[perform] Kafka Username: ${kafkaUsername}`);
    console.log(`[perform] Kafka Password: ${kafkaPassword}`);

    const kafkaConfig: KafkaConfig = {
      clientId,
      brokers: settings.environment === 'Prod' ? prodBrokers : stageBrokers,
      sasl: {
        username: kafkaUsername,
        password: kafkaPassword,
        mechanism: 'scram-sha-512'
      },
      ssl: true
    }

    const newPayload = {message: payload.message};
    const data: ProducerRecord = {
      topic: kafkaTopic,
      messages: [{
        value: JSON.stringify(newPayload.message)
      }]
    }

    console.log(`[perform] Payload constructed as ${JSON.stringify(data)}`);

    try {      
      const producer = new Kafka(kafkaConfig).producer({
        createPartitioner: Partitioners.DefaultPartitioner
      })
      await producer.connect()
      await producer.send(data)
      await producer.disconnect()
      console.log(`[perform] Succesfully sent to Kafka topic ${kafkaTopic}`);
    } catch (error) {
      throw new IntegrationError(
        `Kafka Connection Error: ${(error as KafkaJSError).message}`,
        'KAFKA_CONNECTION_ERROR',
        400
      )
    }
  }

}

export default action
