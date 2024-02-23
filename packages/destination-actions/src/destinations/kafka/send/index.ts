import { Kafka, SASLOptions, ProducerRecord } from 'kafkajs'

import type { ActionDefinition } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

//   const admin = kafka.admin()
//await admin.connect()
//const topics = await admin.listTopics()
//console.log(topics)
//await admin.disconnect()

const sendData = async (settings: Settings, payload: Payload[]) => {

    const groupedPayloads: { [topic: string]: Payload[] } = {};

    payload.forEach(p => {
      const { topic } = p;
      if (!groupedPayloads[topic]) {
        groupedPayloads[topic] = [];
      }
      groupedPayloads[topic].push(p);
    });

    interface PayloadGroup {
      topic: string;
      payloads: Payload[];
    }

    const payloadGroups: PayloadGroup[] = Object.keys(groupedPayloads).map(topic => ({
      topic,
      payloads: groupedPayloads[topic]
    }));
  
    const kafka = new Kafka({
      clientId: settings.clientId,
      brokers: [settings.brokers],
      ssl: true,
      sasl: {
        mechanism: settings.saslAuthenticationMechanism,
        username: settings.username,
        password: settings.password
      } as SASLOptions
    })

    const producer = kafka.producer()

    await producer.connect()
    
    for (const group of payloadGroups) {
      const { topic, payloads } = group;

      const messages = payloads.map(payload => ({
        value: JSON.stringify(payload.payload),
        key: payload.key,
        headers: payload?.headers ?? undefined
      }));

      const data = {
        topic,
        messages
      };
      
      await producer.send(data as ProducerRecord)
    }

    await producer.disconnect()
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to a Kafka topic',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields: {
    topic: {
      label: 'Topic',
      description: 'The Kafka topic to send messages to.',
      type: 'string',
      required: true
    },
    payload: {
      label: 'Payload',
      description: 'The data to send to Kafka',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    },
    headers: {
      label: 'Headers',
      description: 'Header data to send to Kafka. Format is Header key, Header value.',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    },
    key: {
      label: 'Message Key',
      description: 'The key for the message (optional)',
      type: 'string'
    }
  },
  perform: async (_request, { settings, payload }) => { 
    await sendData(settings, [payload])
  },
  performBatch: async (_request, { settings, payload }) => {
    await sendData(settings, payload)
  }
}


export default action
