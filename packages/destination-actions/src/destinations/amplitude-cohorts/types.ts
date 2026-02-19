export type Region = 'north_america' | 'europe'


// https://amplitude.com/api/3/cohorts/upload
export type CreateAudienceRequest = {
    name: string                        // Cohort Name
    app_id: string                      // Amplitude App ID
    id_type: 'BY_AMP_ID' | 'BY_USER_ID' // Device ID not supported by Amplitude Cohorts. Only a few customers will have access to an Amplitude ID. 
    cg?: string                         // Cohort Grouping
    ids: Array<string>                  // List of User IDs or Amplitude IDs. Leave empty when creating
    owner: string                       // Cohort owner. The login email of the user who will own the cohort in Ampltitude
    published: true                     // Whether the cohort should be published immediately
}

// 2XX
export type CreateAudienceResponse = {
    cohortId: string
}

// returns non 2XX
export type CreateAudienceResponseError = {
    error: string
    message: string
}



// Get One Cohort 
// GET 'https://amplitude.com/api/5/cohorts/request/id/${cohort_id}'

export type GetAudienceResponse = {
    cohortId: string
}

// returns non 2XX
export type GetAudienceResponseError = {
    error: string
    message: string
}
