import { ID_TYPES, OPERATIONS } from '../constants'
import { Payload } from './generated-types'
import { ErrorCodes } from '@segment/actions-core'

export type UploadToCohortJSON = {
    cohort_id: string
    skip_invalid_ids: true
    memberships: Array<{
        ids: Array<string>
        id_type: IDType
        operation: Operation
    }>
}

export type IDType = keyof typeof ID_TYPES

export type PayloadMap = Map<number, Payload>

export type Operation = keyof typeof OPERATIONS

export type PossibleErrorCodes = keyof typeof ErrorCodes | 'PAYLOAD_VALIDATION_FAILED' | 'UNKNOWN_ERROR'

export type UploadToCohortResponse = {
    cohort_id: string  
    memberships_result: Array<{
        skipped_ids: Array<string> 
        operation: 'ADD' | 'REMOVE'
    }>
}

export type ResponseError = {
    response: {
        data: {
            error: {
                error: string
                message: string
            }
        }
    }
}