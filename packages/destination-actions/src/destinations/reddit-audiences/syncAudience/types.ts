interface IDArray extends Array<string> {}

// POST https://ads-api.reddit.com/api/v3/custom_audiences/{audience_id}/users
export interface PopulateAudienceJSON {
    data: {
        action_type: 'ADD' | 'REMOVE'
        column_order: string[] // EMAIL_SHA256 MAID_SHA256
        user_data: Array<IDArray>
    }
}

// POST https://ads-api.reddit.com/api/v3/ad_accounts/{ad_account_id}/custom_audiences
export interface CreateAudienceJSON {
    data: {
        name: string 
        type: 'CUSTOMER_LIST'
    }
}

// 200 expected
export interface CreateAudienceResp {
    data: {
      name: string,
      id: string,
      status: "VALID"
    }
}

// 400 expected
export interface CreateAudienceRespError {
    error: {
        code: number,
        message: string
    }
}

// POST https://www.reddit.com/api/v1/access_token
export interface RedditAccessTokenRequest {
    grant_type: string,
    refresh_token: string
}