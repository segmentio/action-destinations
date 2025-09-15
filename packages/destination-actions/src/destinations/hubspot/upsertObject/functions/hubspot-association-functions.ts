import { ModifiedResponse } from '@segment/actions-core'
import { MAX_HUBSPOT_BATCH_SIZE } from '../constants'
import { Client } from '../client'
import {
  AssociationPayload,
  AssociationPayloadWithId,
  AssociationSyncMode,
  AssociationType,
  GroupableFields,
  PayloadWithFromId,
  BatchObjResp
} from '../types'

export function createAssociationPayloads(payloads: PayloadWithFromId[]): AssociationPayload[][] {
  const associationPayloads: AssociationPayload[] = payloads.flatMap((payload) =>
    Array.isArray(payload.associations)
      ? payload.associations
          .filter(
            (association) =>
              association.id_field_value !== undefined &&
              association.id_field_value !== null &&
              association.id_field_value !== ''
          )
          .map((association) => ({
            object_details: {
              object_type: association.object_type,
              id_field_name: association.id_field_name,
              id_field_value: association.id_field_value,
              from_record_id: association.from_record_id
            },
            association_details: {
              association_label: association.association_label
            }
          }))
      : []
  )

  return groupPayloads(associationPayloads, ['object_type', 'id_field_name'])
}

function groupPayloads(associations: AssociationPayload[], groupBy: (keyof GroupableFields)[]): AssociationPayload[][] {
  const groupedPayloads: AssociationPayload[][] = []

  const groups: { [key: string]: AssociationPayload[] } = associations.reduce((acc, payload) => {
    const key = groupBy.map((prop) => payload.object_details[prop]).join('_')
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(payload)
    return acc
  }, {} as { [key: string]: AssociationPayload[] })

  for (const key in groups) {
    const items = groups[key]
    for (let i = 0; i < items.length; i += MAX_HUBSPOT_BATCH_SIZE) {
      groupedPayloads.push(items.slice(i, i + MAX_HUBSPOT_BATCH_SIZE))
    }
  }

  return groupedPayloads
}

export async function sendAssociatedRecords(
  client: Client,
  payloads: AssociationPayload[][],
  associationSyncMode: AssociationSyncMode
): Promise<AssociationPayloadWithId[]> {
  switch (associationSyncMode) {
    case AssociationSyncMode.Upsert: {
      return await upsertAssociatedRecords(client, payloads)
    }
    case AssociationSyncMode.Read: {
      return await readAssociatedRecords(client, payloads)
    }
  }
}

async function readAssociatedRecords(
  client: Client,
  groupedPayloads: AssociationPayload[][]
): Promise<AssociationPayloadWithId[]> {
  const requests = groupedPayloads.map(async (payloads) => {
    const { object_type: objectType } = payloads[0].object_details

    return await client.batchObjectRequest(AssociationSyncMode.Read, objectType, {
      idProperty: payloads[0].object_details.id_field_name,
      properties: [payloads[0].object_details.id_field_name],
      inputs: payloads.map((payload) => {
        return {
          id: payload.object_details.id_field_value
        }
      })
    })
  })
  const responses = await Promise.all(requests)
  return returnAssociatedRecordsWithIds(groupedPayloads, responses)
}

async function upsertAssociatedRecords(
  client: Client,
  groupedPayloads: AssociationPayload[][]
): Promise<AssociationPayloadWithId[]> {
  const requests = groupedPayloads.map(async (payloads) => {
    const { object_type: objectType } = payloads[0].object_details

    return await client.batchObjectRequest(AssociationSyncMode.Upsert, objectType, {
      inputs: payloads.map((payload) => {
        return {
          idProperty: payload.object_details.id_field_name,
          id: payload.object_details.id_field_value,
          properties: {
            [payload.object_details.id_field_name]: payload.object_details.id_field_value
          }
        }
      })
    })
  })
  const responses = await Promise.all(requests)
  return returnAssociatedRecordsWithIds(groupedPayloads, responses)
}

function returnAssociatedRecordsWithIds(
  groupedPayloads: AssociationPayload[][],
  responses: ModifiedResponse<BatchObjResp>[]
): AssociationPayloadWithId[] {
  responses.forEach((response, index) => {
    const payloads = groupedPayloads[index]
    response?.data?.results.forEach((result) => {
      payloads
        .filter(
          (payload) =>
            payload.object_details.id_field_value == (result.properties[payload.object_details.id_field_name] as string)
        )
        .forEach((payload) => ((payload as AssociationPayloadWithId).object_details.record_id = result.id))
    })
  })

  return groupedPayloads
    .flat()
    .filter((payload) => (payload as AssociationPayloadWithId).object_details.record_id) as AssociationPayloadWithId[]
}

export async function sendAssociations(client: Client, payloads: AssociationPayloadWithId[]) {
  const groupedPayloads: AssociationPayloadWithId[][] = groupPayloads(payloads as AssociationPayload[], [
    'object_type'
  ]) as AssociationPayloadWithId[][]

  const requests = groupedPayloads.map(async (payloads) => {
    const toObjectType = payloads[0].object_details.object_type

    const inputs = payloads.map((payload) => {
      const { associationCategory, associationTypeId } = getAssociationType(
        payload.association_details.association_label
      )
      const input = {
        types: [
          {
            associationCategory,
            associationTypeId
          }
        ],
        from: {
          id: payload.object_details.from_record_id
        },
        to: {
          id: payload.object_details.record_id
        }
      }
      return input
    })
    return client.batchAssociationsRequest({ inputs }, toObjectType)
  })

  await Promise.all(requests)
}

function getAssociationType(associationLabel: string): AssociationType {
  const [associationCategory, associationTypeId] = associationLabel.split(':')
  return { associationCategory, associationTypeId } as AssociationType
}
