
import { PayloadValidationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { createHash, randomBytes } from 'crypto'

export function generateKafkaCredentials(settings: Settings, destinationId: string): { kafkaUserName: string, kafkaPassword: string, kafkaTopic: string } {
    
    //throw new PayloadValidationError('Invalid payload: missing required field "host"')

    const kafkaTopic = createHash('sha256').update(destinationId).digest('hex');
    const kafkaUsername = createHash('sha256').update(`${destinationId}_user`).digest('hex').substring(0, 12);
    const kafkaPassword = randomBytes(16).toString('hex');

    return { kafkaUserName: kafkaUsername, kafkaPassword: kafkaPassword, kafkaTopic: kafkaTopic }
}