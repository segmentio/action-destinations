import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const VALID_ADVERTISER_ID = '12345'
const INVALID_ADVERTISER_ID = 'abcd'
const AUDIENCE_KEY = "weekly_active_shoppers_viewed_product_within_7_days"

const event = createTestEvent({
    traits: {
        email: "test.email@test.com"
    },
    properties: {
        "audience_key": AUDIENCE_KEY,
    }
})

const MOCK_TOKEN_RESPONSE = {
    "access_token": "token",
    "token_type": "Bearer",
    "refresh_token": null,
    "expires_in": 900
}

const VALID_SETTINGS = {
    client_id: "client_id",
    client_secret: "client_id",
    advertiser_id: VALID_ADVERTISER_ID
}

const ADVERTISER_AUDIENCES = {
    "meta": {
        "totalItems": 1,
        "limit": 0,
        "offset": 0
    },
    "data": [
        {
            "id": "1234",
            "attributes": {
                "advertiserId": VALID_ADVERTISER_ID,
                "name": AUDIENCE_KEY
            }
        }
    ]
}

const ADVERTISER_AUDIENCES_KEY_DOES_NOT_EXIST = {
    "meta": {
        "totalItems": 1,
        "limit": 0,
        "offset": 0
    },
    "data": [
        {
            "id": "1234",
            "attributes": {
                "advertiserId": VALID_ADVERTISER_ID,
                "name": "Other audience name"
            }
        }
    ]
}

const AUDIENCE_CREATION_RESPONSE = {
    "data": [
        {
            "attributes": {
                "name": AUDIENCE_KEY,
                "description": AUDIENCE_KEY,
                "type": "ContactList",
                "advertiserId": VALID_ADVERTISER_ID,
                "contactList": {
                    "file": null,
                    "isFromPublicApi": true
                }
            },
            "id": "5678",
            "type": "AudienceSegment"
        }
    ],
    "errors": [],
    "warnings": []
}

const DUPLICATE_AUDIENCE_ERROR = {
    "errors": [
        {
            "type": "validation",
            "code": "name-must-be-unique",
            "title": "Segment name must be unique",
            "detail": "Another Segment exists with the name: ABCD"
        }
    ]
}

describe('removeUserFromAudience', () => {
    it('should throw error if no access to the audiences of the advertiser', async () => {
        const settings = VALID_SETTINGS;
        nock('https://api.criteo.com').persist().post('/oauth2/token').reply(200, MOCK_TOKEN_RESPONSE)
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/search$/).query(true).reply(403)
        await expect(
            testDestination.testAction('removeUserFromAudience', {
                event,
                settings,
                useDefaultMappings: true
            })
        ).rejects.toThrowError('Forbidden')
    })

    it('should throw error if advertiser ID is not a number', async () => {
        nock('https://api.criteo.com').persist().post('/oauth2/token').reply(200, MOCK_TOKEN_RESPONSE)

        const settings = {
            client_id: "client_id",
            client_secret: "client_secret",
            advertiser_id: INVALID_ADVERTISER_ID
        }

        await expect(
            testDestination.testAction('removeUserFromAudience', {
                event,
                settings,
                useDefaultMappings: true
            })
        ).rejects.toThrowError('The Advertiser ID should be a number')
    })

    it('should not throw an error if the audience creation and the patch requests succeed', async () => {
        const settings = VALID_SETTINGS;
        nock('https://api.criteo.com').persist().post('/oauth2/token').reply(200, MOCK_TOKEN_RESPONSE)
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/search$/).query(true).reply(200, ADVERTISER_AUDIENCES_KEY_DOES_NOT_EXIST)
        // The audience key is not present in the list of the advertiser's audiences so a new audience needs to be created
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/create$/).reply(200, AUDIENCE_CREATION_RESPONSE)
        nock('https://api.criteo.com').patch(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/\d+\/contact-list$/).reply(200)

        await expect(
            testDestination.testAction('removeUserFromAudience', {
                event,
                settings,
                useDefaultMappings: true
            })
        ).resolves.not.toThrowError()
    })

    it('should not throw an error if the audience already exists and the patch requests succeeds', async () => {
        const settings = VALID_SETTINGS;
        nock('https://api.criteo.com').persist().post('/oauth2/token').reply(200, MOCK_TOKEN_RESPONSE)
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/search$/).query(true).reply(200, ADVERTISER_AUDIENCES)
        nock('https://api.criteo.com').patch(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/\d+\/contact-list$/).reply(200)

        await expect(
            testDestination.testAction('removeUserFromAudience', {
                event,
                settings,
                useDefaultMappings: true
            })
        ).resolves.not.toThrowError()
    })

    it('should not throw an error in case of concurrent audience creation attempt', async () => {
        const settings = VALID_SETTINGS;
        nock('https://api.criteo.com').persist().post('/oauth2/token').reply(200, MOCK_TOKEN_RESPONSE)
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/search$/).query(true).reply(200, ADVERTISER_AUDIENCES_KEY_DOES_NOT_EXIST)
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/create$/).reply(400, DUPLICATE_AUDIENCE_ERROR)
        nock('https://api.criteo.com').post(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/search$/).query(true).reply(200, ADVERTISER_AUDIENCES)
        nock('https://api.criteo.com').patch(/^\/\d{4}-\d{2}\/marketing-solutions\/audience-segments\/\d+\/contact-list$/).reply(200)

        await expect(
            testDestination.testAction('removeUserFromAudience', {
                event,
                settings,
                useDefaultMappings: true
            })
        ).resolves.not.toThrowError()
    })
})
