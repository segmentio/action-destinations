import { AudienceSettings, Settings } from '../generated-types'
import { Payload } from './generated-types'
import {  IntegrationError, PayloadValidationError } from '@segment/actions-core'


export class IterableListsClient {

  
    constructor() {
     
    }

    async assumeRole(): Promise<Credentials> {
        // const intermediaryARN = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS as string
        // const intermediaryExternalId = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID as string
    
        // const intermediaryCreds = await this.getSTSCredentials(intermediaryARN, intermediaryExternalId)
        // return this.getSTSCredentials(this.roleArn, this.externalId, intermediaryCreds)
      }


    processPayload(payload: Payload) {
        if (!payload.email && !payload.user_id) {
          throw new PayloadValidationError('Must include email or user_id.')
        }
      
        const context = rawData.context
        const personas = context.personas as { computation_key: string; computation_id: string; external_audience_id: string }
        if (!personas.computation_key || !personas.computation_id || !personas.external_audience_id) {
          throw new PayloadValidationError(
            'Missing audience parameters: computation id, computation key, and/or audience id.'
          )
        }
      
        const traitsOrProps = rawData.traits || rawData.properties
        const action = traitsOrProps[personas.computation_key] ? 'subscribe' : 'usubscribe'
        const iterablePayload: UpsertUserPayload = {
          listId: Number(personas.external_audience_id),
          action: action,
          dataFields: payload.data_fields,
          preferUserId: true,
          mergeNestedObjects: true
        }
      
        if (payload.email) {
          iterablePayload.email = payload.email
        }
      
        if (payload.user_id) {
          iterablePayload.userId = payload.user_id
        }
      
        return iterablePayload
      }

}