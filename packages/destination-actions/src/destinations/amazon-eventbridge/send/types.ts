export interface PutPartnerEventsCommandJSON {
  Entries: Array<EntryItem>
}

export interface EntryItem {
  Time: Date
  Source: string
  Resources: string[]
  DetailType: string
  Detail: string
}

export interface HookError {
  error: {
    message: string
    code: string
  }
}

export interface HookSuccess {
  successMessage: string
  savedData: {
    sourceId: string
  }
}

export interface HookOutputs {
  onMappingSave?: {
    outputs: {
      sourceId: string
    }
  }
  retlOnMappingSave?: {
    outputs: {
      sourceId: string
    }
  }
}
