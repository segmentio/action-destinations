export interface SingleStoreCreateJSON {
  host: string
  port: number
  username: string // The username of the Singlestore database
  password: string // The password of the Singlestore database
  dbName: string
  destinationIdentifier: string
  noRollbackOnFailure: boolean
  kafkaUsername: string // The username of the Kafka instance. Gets genertated by the Destination
  kafkaPassword: string // The password of the Kafka instance. Gets genertated by the Destinatiom
  kafkaTopic: string // The topic of the Kafka instance. Gets genertated by the Destination
}

export interface SingleStoreMessage {
  type: string
  event: string
  timestamp: string
  messageId: string
  message: string
}

export interface GetDatabaseJSON {
  destinationIdentifier: string
}

export interface GetDatabaseResponse {
  kafkaUserName: string
  kafkaPassword: string
  kafkaTopic: string
}

export interface MaybeTimeoutError {
  response: {
    data: {
      error: {
        message: string
        code: string
      }
    }
  }
}
