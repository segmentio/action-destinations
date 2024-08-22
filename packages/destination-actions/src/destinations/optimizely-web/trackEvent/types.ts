export interface OptimizelyPayload {
    account_id: string
    anonymize_ip: boolean
    client_name: 'Segment Optimizely Web Destination',
    client_version: string,
    enrich_decisions: true,
    visitors: Array<Visitor>
}

export interface Visitor  {
    visitor_id: string,
    attributes: [], // should be empty array
    snapshots: [
        {
            decisions: [], // should be empty array
            events: [
                {
                    entity_id: string,
                    key: string,
                    timestamp: string,
                    uuid: string,
                    type: string,
                    tags: {
                        revenue: number,
                        value: number,
                        quantity: number
                    },
                    properties: {
                        [key: string]: string
                    }
                }
            ]
        }
    ]
}

export interface Snapshot {
    decisions: [],
    events: Array<Event>
}

export interface Event {
    entity_id: string,
    key: string,
    timestamp: number, // 13 digit unix
    uuid: string,
    tags: {
        revenue?: number
        value?: number
        quantity?: number
        $opt_event_properties?: {
            [key: string]: string | number | boolean
        };
        [key: string]: string | number | { [key: string]: string | number | boolean } | undefined
    }
}