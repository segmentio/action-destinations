import { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { GetDatabaseJSON, MaybeTimeoutError } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to Singlestore.',
  defaultSubscription:
    'type = "track" or type = "screen" or type = "identify" or type = "page" or type = "group" or type = "alias"',
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
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Whether to enable batching of messages before sending.',
      type: 'boolean',
      required: true,
      unsafe_hidden: true,
      readOnly: true,
      default: true
    },
    max_batch_size: {
      label: 'Max Batch Size',
      description: 'The maximum number of messages to include in a batch.',
      type: 'number',
      required: true,
      unsafe_hidden: true,
      readOnly: true,
      default: 1000
    }
  },
  dynamicFields: {
    database: async (_,__): Promise<DynamicFieldResponse> => {
      // const destination_id = destinationId(settings)
      // const json: GetDatabaseJSON = {
      //   destinationIdentifier: destination_id
      // }
      // try {
      //   await request<GetDatabaseJSON>(getDatabaseURL, {
      //     method: 'POST',
      //     headers: {
      //       'x-security-key': process.env.ACTIONS_SINGLE_STORE_X_SECURITY_KEY as string
      //     },
      //     json
      //   })
      // } catch (err) {
      //   return {
      //     choices: [],
      //     nextPage: '',
      //     error: {
      //       message: (err as MaybeTimeoutError).response?.data?.error?.message ?? 'Unknown error',
      //       code: (err as MaybeTimeoutError).response?.data?.error?.code ?? 'Unknown error'
      //     }
      //   }
      // }

      return Promise.resolve({
        choices: [
          {
            label: "db",
            value: "db"
          }
        ]
      } as DynamicFieldResponse)
    }
  },
  perform: async (_) => {
    // checkChamber()
    // const { kafkaConfig, kafkaTopic } = getKafkaConfiguration(settings)
    // const producerRecord = getProducerRecord(kafkaTopic, payload.message)

    // try {
    //   const producer = new Kafka(kafkaConfig).producer({
    //     createPartitioner: Partitioners.DefaultPartitioner
    //   })
    //   await producer.connect()
    //   await producer.send(producerRecord)
    //   await producer.disconnect()
    // } catch (error) {
    //   throw new IntegrationError(
    //     `Kafka Connection Error: ${(error as KafkaJSError).message}`,
    //     'KAFKA_CONNECTION_ERROR',
    //     400
    //   )
    // }
  },
  // performBatch: async (request, { payload, settings }) => {

  // }
}

export default action
