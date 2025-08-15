export interface PutPartnerEventsCommandJSON{
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