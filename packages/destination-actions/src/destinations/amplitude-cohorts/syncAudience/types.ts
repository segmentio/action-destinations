// 'https://amplitude.com/api/3/cohorts/membership' 
// partner advises to send add and removes in separate requests. 
export type UploadToCohortJSON = {
    cohort_id: string,
    memberships: Array<{
        ids: Array<string>,
        id_type: 'BY_AMP_ID' | 'BY_USER_ID',
        operation: 'ADD' | 'REMOVE'
    }>
    skip_invalid_ids: true
}

// {
//     cohort_id: '1234',
//     memberships: [
//         {ids: ['user1', 'user2', 'user3'], id_type: 'BY_USER_ID', operation: 'ADD'},
//         {ids: ['user4', 'user5'], id_type: 'BY_USER_ID', operation: 'REMOVE'}
//     ]
// }



// example. list of 10 users. 2 are bad. skip_invalid_ids = false. => whole batch fails because 2 users are invalid. 
// example. list of 10 users. 2 are bad. skip_invalid_ids = true. => batch succeeds but 2 users are not added to the cohort

// 2XX
export type UploadToCohortResponse = {
    cohort_id: string // the Cohort which was updated. 
    memberships_result: Array<{
        skipped_ids: Array<string> // list of user ids that were skipped because they were invalid. 
        operation: 'ADD' | 'REMOVE'
    }>
}

// {
//      cohort_id: '1234',
//      memberships_result: [
//         { skipped_ids: [], operation: 'ADD' },
//         { skipped_ids: ['user4'], operation: 'REMOVE' }
//      ]
// }

// returns non 2XX
export type UploadToCohortResponseError = {
    error: string
    message: string
}

