import { Payload } from './generated-types'
import { ErrorCodes } from '@segment/actions-core'
import { Operation, UploadToCohortJSON } from '../types'

export type { UploadToCohortJSON, Operation }

export type PayloadMap = Map<number, Payload>

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