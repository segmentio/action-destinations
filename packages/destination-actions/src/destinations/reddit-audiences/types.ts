
import { MAID_SCHEMA_NAME, EMAIL_SCHEMA_NAME } from './const'

export interface CreateAudienceResp {
    id: string
}

export interface CreateAudienceReq {
    data: {
        name: string
        type: string
    }
}

export interface UpdateAudienceReq {
    data: {
        column_order: Columns
        user_data: string[][],
        action_type: 'ADD' | 'REMOVE'
    }
}

export type Columns = (typeof MAID_SCHEMA_NAME | typeof EMAIL_SCHEMA_NAME)[]