import { ModifiedResponse } from '@segment/actions-core'
import { Payload } from '../generated-types'
import { Client } from '../client'
import {
  ObjReqType,
  CreateReq,
  PayloadWithFromId,
  ReadReq,
  ReadType,
  BatchObjResp,
  SyncMode,
  UpsertReq
} from '../types'

export async function sendFromRecords(
  client: Client,
  payloads: Payload[],
  objectType: string,
  syncMode: SyncMode
): Promise<PayloadWithFromId[]> {
  switch (syncMode) {
    case SyncMode.Upsert: {
      return await upsertRecords(client, payloads, objectType)
    }

    case SyncMode.Update: {
      return await updateRecords(client, payloads, objectType)
    }

    case SyncMode.Add: {
      return await addRecords(client, payloads, objectType)
    }
  }
}

async function upsertRecords(client: Client, payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
  const response = await client.batchObjectRequest(ObjReqType.Upsert, objectType, {
    inputs: payloads.map(({ object_details: { id_field_value }, properties, sensitive_properties }) => {
      const idFieldName = payloads[0].object_details.id_field_name
      return {
        idProperty: idFieldName,
        id: id_field_value,
        properties: { ...properties, ...sensitive_properties, [idFieldName]: id_field_value }
      }
    })
  } as UpsertReq)

  return returnRecordsWithIds(payloads, response)
}

async function updateRecords(client: Client, payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
  const existingRecords = (await readRecords(
    client,
    payloads,
    objectType,
    ReadType.ReturnRecordsWithIds
  )) as unknown as Payload[]

  if (existingRecords.length === 0) {
    return [] as PayloadWithFromId[]
  }

  const response = await client.batchObjectRequest(ObjReqType.Update, objectType, {
    inputs: existingRecords.map(({ object_details: { id_field_value }, properties, sensitive_properties }) => {
      const idFieldName = payloads[0].object_details.id_field_name
      return {
        idProperty: idFieldName,
        id: id_field_value,
        properties: { ...properties, ...sensitive_properties }
      }
    })
  } as UpsertReq)

  return returnRecordsWithIds(existingRecords, response)
}

async function addRecords(client: Client, payloads: Payload[], objectType: string): Promise<PayloadWithFromId[]> {
  const recordsToCreate = (await readRecords(
    client,
    payloads,
    objectType,
    ReadType.ReturnRecordsWithoutIds
  )) as Payload[]

  const response: ModifiedResponse<BatchObjResp> = await client.batchObjectRequest(ObjReqType.Create, objectType, {
    inputs: recordsToCreate.map(
      ({ object_details: { id_field_value: fromIdFieldValue }, properties, sensitive_properties }) => {
        const idFieldName = payloads[0].object_details.id_field_name
        return {
          idProperty: idFieldName,
          properties: { ...properties, ...sensitive_properties, [idFieldName]: fromIdFieldValue }
        }
      }
    )
  } as CreateReq)

  return returnRecordsWithIds(recordsToCreate, response)
}

async function readRecords(
  client: Client,
  payloads: Payload[],
  objectType: string,
  readType: ReadType
): Promise<PayloadWithFromId[] | Payload[]> {
  const idFieldName = payloads[0].object_details.id_field_name

  const readResponse = await client.batchObjectRequest(ObjReqType.Read, objectType, {
    properties: [idFieldName],
    idProperty: idFieldName,
    inputs: payloads.map((payload) => {
      return { id: payload.object_details.id_field_value }
    })
  } as ReadReq)

  switch (readType) {
    case ReadType.ReturnRecordsWithIds:
      return returnRecordsWithIds(payloads, readResponse)
    case ReadType.ReturnRecordsWithoutIds:
      return returnRecordsWithoutIds(payloads, readResponse)
  }
}

function returnRecordsWithIds(payloads: Payload[], response: ModifiedResponse<BatchObjResp>): PayloadWithFromId[] {
  const results = response?.data?.results || []
  const matchingRecords = payloads
    .map((payload) => {
      const matchingResult = results.find((result) => {
        return result.properties[payload.object_details.id_field_name] === payload.object_details.id_field_value
      })
      if (matchingResult) {
        const payloadWithIds = {
          ...payload,
          object_details: { ...payload.object_details, record_id: matchingResult.id }
        } as PayloadWithFromId
        if (payloadWithIds.associations) {
          payloadWithIds.associations.forEach((association) => {
            association.from_record_id = matchingResult.id
          })
        }

        return payloadWithIds
      }
      return null
    })
    .filter((payload) => payload !== null)
  return matchingRecords as unknown as PayloadWithFromId[]
}

function returnRecordsWithoutIds(payloads: Payload[], response: ModifiedResponse<BatchObjResp>): Payload[] {
  const missingRecords = payloads.filter((payload) => {
    return !response.data.results.some((result) => {
      return result.properties[payload.object_details.id_field_name] === payload.object_details.id_field_value
    })
  })
  return missingRecords
}
