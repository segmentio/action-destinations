export type Region = 'north_america' | 'europe'

export type CreateAudienceJSON = {
    name: string                        // Cohort Name
    app_id: string                      // Amplitude App ID
    id_type: 'BY_AMP_ID' | 'BY_USER_ID' // Device ID not supported by Amplitude Cohorts. Only a few customers will have access to an Amplitude ID. 
    cg?: string                         // Cohort Grouping
    ids: Array<string>                  // List of User IDs or Amplitude IDs. Leave empty when creating
    owner: string                       // Cohort owner. The login email of the user who will own the cohort in Ampltitude
    published: true                     // Whether the cohort should be published immediately
}

export type CreateAudienceResponse = {
    cohortId: string
}

export type GetAudienceResponse = {
    cohortId: string
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

