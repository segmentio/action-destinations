export interface SingleStoreCreateJSON {
    host: string
    port: number
    username: string // The username of the Singlestore database 
    password: string // The password of the Singlestore database
    dbName: string,
    destinationIdentifier: string,    
    noRollbackOnFailure: false, 
    kafkaUserName: string, // The username of the Kafka instance. Gets genertated by the Destination 
    kafkaPassword: string, // The password of the Kafka instance. Gets genertated by the Destinatiom
    kafkaTopic: string // The topic of the Kafka instance. Gets genertated by the Destination
}

export interface SingleStoreMessage {
    type: string
    event: string
    timestamp: string
    messageId: string
    message: string
}