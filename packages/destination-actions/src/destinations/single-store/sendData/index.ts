import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Kafka, ProducerRecord, Partitioners, SASLOptions, KafkaConfig, KafkaJSError } from 'kafkajs'

export const DEFAULT_PARTITIONER = 'DefaultPartitioner'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to SingleStore',
  fields: {
    payload: {
      label: 'Payload',
      description: 'The data to send to SingleStore',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    },
  },
  perform: (-, { payload }) => {
    
    const broker
    const clientId 
    const mechanism = 'aws'
    const accessKeyId =
    const secretAccessKey
    const authorizationIdentity 
    const ssl_enabled = true 
    
    
    
  }
}

export default action
