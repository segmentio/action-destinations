import { OnMappingSaveOutputs, RetlOnMappingSaveOutputs} from './generated-types'

export interface PutPartnerEventsCommandJSON {
    Entries: Array<EntryItem>
}

export interface EntryItem {
    Time: Date
    Source: string
    Resources: string[]
    DetailType: string
    Detail: string
    EventBusName: string
}

export interface HookError {
    error: {
        message: string
        code: string
    }
}

export interface HookSuccess {
    successMessage: string,
    savedData: {
        sourceId: string
    }   
}

export interface HookOutputs { 
    onMappingSave?: OnMappingSaveOutputs
    retlOnMappingSave?: RetlOnMappingSaveOutputs 
}
