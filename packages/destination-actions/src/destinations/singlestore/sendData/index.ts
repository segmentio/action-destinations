import { ActionDefinition, DynamicFieldResponse, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { GetDatabaseJSON } from '../types'
import { getDatabaseURL, clientId, prodBrokers, stageBrokers } from '../const'
import { Kafka, ProducerRecord, Partitioners, KafkaConfig, KafkaJSError } from 'kafkajs'
import { createHash, randomBytes } from 'crypto'  

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
    type: {
      label: 'Type',
      description: 'The type of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    messageId: {
      label: 'Message ID',
      description: 'The message ID of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    message: {
      label: 'Message',
      description: 'The complete event payload.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.'
      }
    }
  },
  dynamicFields: {
    database: async (request, { settings, subscriptionMetadata }): Promise<DynamicFieldResponse> => {
        console.log(settings)
        console.log(subscriptionMetadata)

        const json: GetDatabaseJSON = {
            // map request body here
        }

        const response = await request<GetDatabaseJSON>(getDatabaseURL, {
            method: 'POST',
            headers: {}, 
            json
        })


        return Promise.resolve({
            choices: [{
                label: 'Database 1',
                value: 'database1'
            },{
                label: 'Database 2',
                value: 'database2'
            }]
      } as DynamicFieldResponse)
    }
  },
  perform: async (_, {payload, settings}) => {
    
    const destinationId = "someTempValue"

    const kafkaTopic = createHash('sha256').update(destinationId).digest('hex')
    const kafkaUserName = createHash('sha256').update(`${destinationId}_user`).digest('hex').substring(0, 12)
    const kafkaPassword = randomBytes(16).toString('hex')

    const kafkaConfig: KafkaConfig = {
      clientId,
      brokers: settings.environment === 'Prod' ? prodBrokers : stageBrokers,
      sasl: {
        username: kafkaUserName,
        password: kafkaPassword,
        mechanism: 'scram-sha-512'
      }
    }

    const data: ProducerRecord = {
      topic: kafkaTopic,
      messages: [{
        value: JSON.stringify(payload)
      }]
    }

    try {      
      const producer = new Kafka(kafkaConfig).producer({
        createPartitioner: Partitioners.DefaultPartitioner
      })
      await producer.connect()
      await producer.send(data)
      await producer.disconnect()
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
