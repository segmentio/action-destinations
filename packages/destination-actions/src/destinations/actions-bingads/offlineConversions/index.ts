import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ModifiedResponse } from '@segment/actions-core'
import { getAccessToken } from './formatter'

let authenticationToken = 'XXXXXXXX' //accessToken here;
// var refreshToken = 'M.R3_BAY.-Ccb7GdPKpKqhefUoUDICHhxpxa7K6oCL24voPUZd1Jcj7gH3plGr6tjQxsmSMnvHE*SFbtxDZMx74Q0wyVBXa2GAjGhGu1NC6PE95Ffgil*ZIrb1IgDgFUF0YeK6PDK!UocQJVgDVUB2d5v6hAn*p!Dva2IMkGWRltJdcYjxP0fVJ2MRNlo!YsJI7Ix6wkZ9bpN!7R*ysCDESnSp!blNhWARjeDH2OdboFB5m!s1wf9Od3MKzHkYnKNVGyCiRIPGVEAIKDtttMswLSGXtbnE9Bxaq7XaAjqdo0fceb7fK3S0qfj0xQdGDwlEv91Ej8b0Bq4BM4VIhrLfOJcM6oh3gBAHsii7Y8HDLoxmLZ06SE6ctgvWZBYM8TCgvm!*RiYGKxKautznLZ0uUQu5wvQfAe7RRSxgcG6crrnyTdpQWNhZ'//refreshToken here;
// var msCode = 'M.R3_BAY.c645685b-2439-70a0-3f90-c6ca26b8189b'//msCode here;
// const clientSecret = 'OnJ8Q~q6vhOeOz5EGUZ5wU0NGvFRKMT~aTD6Ua_w'//clientSecret here;
const aId = '138093021' //aid here;
const cId = '252186800' //cid here
const devToken = '1455Q19VPS983002' //devToken here
// const clientId = '93a71c20-5cd5-4791-a43c-a9ffb6c0b0d7'//clientId here

const action: ActionDefinition<Settings, Payload> = {
  title: 'Offline Conversions',
  description: '',
  fields: {
    // client_id: {
    //   label: 'Client ID',
    //   description: 'Client ID',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // },
    scope: {
      label: 'scope',
      description: 'scope',
      type: 'string',
      format: 'text',
      required: true
    },
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
    refresh_token: {
      label: 'refresh_token',
      description: 'refresh_token',
      type: 'string',
      format: 'text',
      required: true
    }
    // code: {
    //   label: 'code',
    //   description: 'code',
    //   type: 'string',
    //   format: 'text',
    //   required: true
    // }
  },
  perform: async (request, data) => {
    console.log('Raw Data: ', data.rawData.properties)
    console.log('Payload: ', data.payload)

    const response_data = await getAccessToken({
      client_id: data.settings.client_id, //data.payload.client_id,
      scope: data.payload.scope,
      redirect_uri: data.settings.redirect_uri,
      grant_type: 'refresh_token',
      client_secret: data.settings.client_secret,
      refresh_token: data.payload.refresh_token
    })

    authenticationToken = response_data.access_token
    console.log('Access Token retrieved using Refresh Token ')
    let conversionTime = data.rawData.properties.conversionTime || data.rawData.properties.Conversion_Time
    //this (if statement below) is custom code to convert payload timestamp to correct XML Soap format
    //not needed if client is sending in correct format
    if (conversionTime.includes('UTC')) {
      const val2 = conversionTime.replace(' UTC', '')
      conversionTime = val2.replace(' ', 'T')
    }
    const conversionCurrency =
      data.rawData.properties.conversionCurrency || data.rawData.properties.Conversion_Currency || 'USD'
    const msCId = data.rawData.properties.msCId || data.rawData.properties.msCID
    const conversionValue = data.rawData.properties.conversionValue || data.rawData.properties.Conversion_Value
    const conversionName = data.rawData.properties.conversionName || data.rawData.properties.Conversion_Name
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
      aId +
      '</CustomerAccountId>' +
      '<CustomerId i:nil="false">' +
      cId +
      '</CustomerId>' +
      '<DeveloperToken i:nil="false">' +
      devToken +
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
