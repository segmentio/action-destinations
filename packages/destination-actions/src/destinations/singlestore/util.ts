// import * as crypto from 'crypto'
// import { CLIENT_ID, STAGE_BROKERS, PROD_BROKERS } from './const'
// import { Settings } from './generated-types'
// // eslint-disable-next-line no-restricted-syntax
// import { createHash } from 'crypto'
// import { KafkaConfig, ProducerRecord } from 'kafkajs'


// export const encryptText = (inputData: string): string => {
//   const keyBuffer = Buffer.from(process.env.ACTIONS_SINGLE_STORE_ENCRYPTION_KEY as string, 'hex')
//   const ivBuffer = Buffer.from(process.env.ACTIONS_SINGLE_STORE_IV as string, 'hex')
//   const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer)
//   let encryptedData = cipher.update(inputData, 'utf8', 'hex')
//   encryptedData += cipher.final('hex')
//   return encryptedData
// }


// export const getKafkaConfiguration = (settings: Settings): { kafkaConfig: KafkaConfig; kafkaTopic: string } => {
//   const destination_id = destinationId(settings)
//   const kafkaTopic = createHash('sha256').update(destination_id).digest('hex')
//   const kafkaUsername = createHash('sha256').update(`${destination_id}_user`).digest('hex')
//   const kafkaPassword = encryptText(kafkaUsername)
//   const kafkaConfig: KafkaConfig = {
//     clientId: CLIENT_ID,
//     brokers: settings.environment === 'Prod' ? PROD_BROKERS : STAGE_BROKERS,
//     sasl: {
//       username: kafkaUsername,
//       password: kafkaPassword,
//       mechanism: 'scram-sha-512'
//     },
//     ssl: true
//   }
//   return { kafkaConfig, kafkaTopic }
// }

// export const getProducerRecord = (kafkaTopic: string, message: unknown): ProducerRecord => {
//   return {
//     topic: kafkaTopic,
//     messages: [
//       {
//         value: JSON.stringify(message)
//       }
//     ]
//   }
// }
