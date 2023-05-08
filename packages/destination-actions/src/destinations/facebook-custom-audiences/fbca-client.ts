import { RequestClient } from "@segment/actions-core"

const API_VERSION = 'v16.0'
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`

export default class Facebook {
    request: RequestClient
    constructor(request: RequestClient) {
        this.request = request
    }

    createAudience = async (accountId: string) => {
        return this.request(`${BASE_URL}/${accountId}/customaudiences`, {
            method: 'POST',
            json: {
                name: "Test_in_actions",
                subtype: "CUSTOM",
            }
        })
    }

    updateAudience = async (audienceId: string) => {
        return this.request(`${BASE_URL}/${audienceId}/users`, {
            method: 'POST',
            json: {
                payload: {
                    schema: "EMAIL_SHA256",
                    data: [
                        "25f386f5f791e81a687200837c8b1fa069c5d7bbdb61892b36ceca92bb2a2d06"
                    ]
                }
            }
        })
    }

}