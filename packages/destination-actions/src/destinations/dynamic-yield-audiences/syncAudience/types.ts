

export interface DynamicYieldRequestJSON {
    type: 'audience_membership_change_request'
    id: string
    timestamp_ms: number
    account: {
        account_settings: {
            sectionId: string,
            identifier: string,
            connectionKey: string
        }
    },
    user_profiles: [
    {
        user_identities: [
        {
            type: string
            encoding: '"sha-256"' | 'raw'
            value: string
        }
        ],
        audiences: [
            {
                audience_id: number, // must be sent as an integer
                audience_name: string,
                action: 'add' | 'delete'
            }
        ]
    }]
}