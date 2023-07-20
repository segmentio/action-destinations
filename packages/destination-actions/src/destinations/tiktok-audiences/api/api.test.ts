import nock from 'nock'
import createRequestClient from '../../../../../core/src/create-request-client'
import { TikTokAudiences } from './index'
import { BASE_URL, TIKTOK_API_VERSION } from '../constants'
const settings = {
  advertiser_ids: ['1234567890', '0987654321', '2345675643']
}

const requestClient = createRequestClient()

describe('TikTok', () => {
  describe('fetchAdvertisers', () => {
    const tiktok: TikTokAudiences = new TikTokAudiences(requestClient)

    it('should fetch a list of advertisers, with their names', async () => {
      nock(`${BASE_URL}${TIKTOK_API_VERSION}/advertiser/info`)
        .get(`/`)
        .query({ advertiser_ids: JSON.stringify(settings.advertiser_ids) })
        .reply(200, {
          code: 0,
          message: 'success',
          data: {
            list: [
              // This is the response shape returned by TikTok.
              // The entire response shape is included here for documentation.
              {
                balance: 0.0,
                email: 'd*******************@***********',
                promotion_area: '0',
                display_timezone: 'America/New_York',
                create_time: 1672341876,
                telephone_number: '+10000****00',
                license_no: '',
                description: null,
                license_province: null,
                address: '',
                industry: '292801',
                currency: 'USD',
                rejection_reason: '-',
                country: 'US',
                license_url: null,
                timezone: 'Etc/GMT+5',
                license_city: null,
                brand: null,
                promotion_center_province: null,
                advertiser_account_type: 'AUCTION',
                status: 'STATUS_ENABLE',
                cellphone_number: '+10000****00',
                name: 'TestAccount1',
                role: 'ROLE_ADVERTISER',
                contacter: 'Se***nt',
                promotion_center_city: null,
                advertiser_id: '1234567890',
                language: '',
                company: 'Segment'
              },
              {
                advertiser_id: '0987654321',
                name: 'TestAccount2'
              },
              {
                advertiser_id: '2345675643',
                name: 'TestAccount3'
              }
            ]
          }
        })

      const fetchAdvertisersRes = await tiktok.fetchAdvertisers(settings.advertiser_ids)
      expect(fetchAdvertisersRes).toEqual({
        choices: [
          {
            label: 'TestAccount1',
            value: '1234567890'
          },
          {
            label: 'TestAccount2',
            value: '0987654321'
          },
          {
            label: 'TestAccount3',
            value: '2345675643'
          }
        ]
      })
    })

    it('should fallback to stored advertiser_ids if tiktok returns an error', async () => {
      nock(`${BASE_URL}${TIKTOK_API_VERSION}/advertiser/info`)
        .get(`/`)
        .query({ advertiser_ids: JSON.stringify(settings.advertiser_ids) })
        .reply(500, {
          code: 500,
          message: 'Internal Server Error'
        })

      const fetchAdvertisersRes = await tiktok.fetchAdvertisers(settings.advertiser_ids)

      expect(fetchAdvertisersRes).toEqual({
        choices: [
          {
            label: '1234567890',
            value: '1234567890'
          },
          {
            label: '0987654321',
            value: '0987654321'
          },
          {
            label: '2345675643',
            value: '2345675643'
          }
        ],
        error: {
          message: 'Internal Server Error',
          code: '500'
        }
      })
    })
  })
  describe('.fetchAudiences', () => {
    const tiktok: TikTokAudiences = new TikTokAudiences(requestClient)

    const selected_advertiser_id = '1234567890'
    const page_number = 1

    it('should dynamically fetch list of audiences and name', async () => {
      nock(`${BASE_URL}${TIKTOK_API_VERSION}/dmp/custom_audience/list/`)
        .get(`/`)
        .query({
          advertiser_id: selected_advertiser_id,
          page: page_number,
          page_size: '100'
        })
        .reply(200, {
          code: 0,
          message: 'success',
          data: {
            page_info: {
              page_size: 10,
              total_number: 1,
              page: 1,
              total_page: 1
            },
            list: [
              {
                cover_num: 6489086,
                is_valid: false,
                calculate_type: null,
                is_creator: false,
                audience_id: '123',
                name: 'CUSTOM_AUDIENCE_NAME',
                is_expiring: false,
                create_time: '2022-05-26 22:12:12',
                audience_type: 'Lookalike Audience',
                expired_time: '2023-09-08 02:34:20',
                shared: true
              },
              {
                cover_num: 6489085,
                is_valid: false,
                calculate_type: null,
                is_creator: false,
                audience_id: '124',
                name: 'CUSTOM_AUDIENCE_NAME1',
                is_expiring: false,
                create_time: '2022-05-26 22:12:12',
                audience_type: 'Lookalike Audience',
                expired_time: '2023-09-08 02:34:20',
                shared: true
              }
            ]
          }
        })

      const fetchAudiencesRes = await tiktok.fetchAudiences(selected_advertiser_id)
      expect(fetchAudiencesRes).toEqual({
        choices: [
          {
            label: 'CUSTOM_AUDIENCE_NAME',
            value: '123'
          },
          {
            label: 'CUSTOM_AUDIENCE_NAME1',
            value: '124'
          }
        ]
      })
    })
  })
})
