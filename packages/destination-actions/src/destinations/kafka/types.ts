export const DEFAULT_PARTITIONER = 'DefaultPartitioner'
import { Producer } from 'kafkajs'

export interface Message {
  value: string
  key?: string
  headers?: { [key: string]: string }
  partition?: number
  partitionerType?: typeof DEFAULT_PARTITIONER
}

export interface TopicMessages {
  topic: string
  messages: Message[]
}

export interface SSLConfig {
  ca: string[]
  rejectUnauthorized?: boolean
  key?: string
  cert?: string
}

export interface CachedProducer {
  producer: Producer
  isConnected: boolean
  lastUsed: number
}
