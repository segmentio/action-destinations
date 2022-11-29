import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ModifiedResponse } from '@segment/actions-core'
import { getAccessToken } from './formatter'

let authenticationToken = 'XXXXXXXX' //accessToken here;

const action: ActionDefinition<Settings, Payload> = {
  title: 'Offline Conversions',
  description: 'TODO',
  fields: {
    ConversionCurrencyCode: {
      label: 'Conversion Currency Code',
      description: 'Conversion Currency Code',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.conversionCurrency'
      }
    },
    ConversionName: {
      label: 'Conversion Name',
      description: 'Conversion Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.conversionName'
      }
    },
    ConversionTime: {
      label: 'Conversion Time',
      description: 'Conversion Time',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.conversionTime'
      }
    },
    ConversionValue: {
      label: 'Conversion Value',
      description: 'Conversion Value',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.conversionValue'
      }
    },
    MicrosoftClickId: {
      label: 'Microsoft Click Id',
      description: 'Microsoft Click Id',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.msCId'
      }
    }
    // client_id: {
    //   label: 'Client ID',
    //   description: 'Client ID',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // },
    // scope: {
    //   label: 'scope',
    //   description: 'scope',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // },
    // redirect_uri: {
    //   label: 'redirect_uri',
    //   description: 'redirect_uri',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // },
    // grant_type: {
    //   label: 'grant_type',
    //   description: 'grant_type',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // },
    // client_secret: {
    //   label: 'client_secret',
    //   description: 'client_secret',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // },
    // refresh_token: {
    //   label: 'refresh_token',
    //   description: 'refresh_token',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // }
    // code: {
    //   label: 'code',
    //   description: 'code',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // }
  },
  perform: async (request, data) => {
    // console.log('Raw Data: ', data.rawData.properties)
    // console.log('Payload: ', data.payload)

    const response_data = await getAccessToken({
      client_id: data.settings.client_id, //data.payload.client_id,
      scope: data.settings.scope,
      redirect_uri: data.settings.redirect_uri,
      grant_type: 'refresh_token',
      client_secret: data.settings.client_secret,
      refresh_token: data.settings.refreshToken
    })

    authenticationToken = response_data.access_token
    console.log('Access Token retrieved using Refresh Token ')
    let conversionTime = data.payload.ConversionTime //|| data.rawData.properties.Conversion_Time
    //this (if statement below) is custom code to convert payload timestamp to correct XML Soap format
    //not needed if client is sending in correct format
    if (conversionTime.includes('UTC')) {
      const val2 = conversionTime.replace(' UTC', '')
      conversionTime = val2.replace(' ', 'T')
    }
    const conversionCurrency = data.payload.ConversionCurrencyCode //|| data.rawData.properties.Conversion_Currency || 'USD'
    const msCId = data.payload.MicrosoftClickId //|| data.rawData.properties.msCID
    const conversionValue = data.payload.ConversionValue //|| data.rawData.properties.Conversion_Value
    const conversionName = data.payload.ConversionName //|| data.rawData.properties.Conversion_Name
    console.log('Conversion Goal: ', conversionName)
    // this code is to switch to a second MS account based on need of client (all of this will move to settings for mapping)
    // if (conversionName == 'CCRevenue') {
    //   // account 2
    //   authenticationToken = //accessToken here;
    //   refreshToken = //refreshToken here;
    //   msCode = //msCode here;
    //   aId = //aid here;
    // }
    // let tokenResponse = {};
    // tokenResponse = await fetchAccessTokenUsingRefreshToken(settings);
    // authenticationToken = tokenResponse.access_token;
    // Learn more at https://segment.com/docs/connections/spec/track/
    const endpoint =
      'https://campaign.api.bingads.microsoft.com/Api/Advertiser/CampaignManagement/V13/CampaignManagementService.svc?singleWsdl' // replace with your endpoint
    // console.log(endpoint)
    const sr =
      '<s:Envelope xmlns:i="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
      '<s:Header xmlns="https://bingads.microsoft.com/CampaignManagement/v13">' +
      '<Action mustUnderstand="1">ApplyOfflineConversions</Action>' +
      '<AuthenticationToken i:nil="false">' +
      authenticationToken +
      '</AuthenticationToken>' +
      '<CustomerAccountId i:nil="false">' +
      data.settings.customer_account_id +
      '</CustomerAccountId>' +
      '<CustomerId i:nil="false">' +
      data.settings.customer_id +
      '</CustomerId>' +
      '<DeveloperToken i:nil="false">' +
      data.settings.developer_token +
      '</DeveloperToken>' +
      '</s:Header>' +
      '<s:Body>' +
      '<ApplyOfflineConversionsRequest xmlns="https://bingads.microsoft.com/CampaignManagement/v13">' +
      '<OfflineConversions i:nil="false"><OfflineConversion><ConversionCurrencyCode i:nil="false">' +
      conversionCurrency +
      '</ConversionCurrencyCode>' +
      '<ConversionName i:nil="false">' +
      conversionName +
      '</ConversionName>' +
      '<ConversionTime>' +
      conversionTime +
      '</ConversionTime>' +
      '<ConversionValue i:nil="false">' +
      conversionValue +
      '</ConversionValue>' +
      '<MicrosoftClickId i:nil="false">' +
      msCId +
      '</MicrosoftClickId></OfflineConversion></OfflineConversions>' +
      '</ApplyOfflineConversionsRequest></s:Body></s:Envelope>'

    try {
      const response: ModifiedResponse<unknown> = await request(endpoint, {
        method: 'post',
        headers: {
          SOAPAction: 'ApplyOfflineConversions',
          'Content-Type': 'text/xml;charset=utf-8'
        },
        body: sr,
        redirect: 'follow'
      })
      console.log('***** Conversion Attributed successfully! *****')
      console.log(response)
    } catch (error) {
      // Retry on connection error
      console.log(error.message)
    }
  }
}

export default action
