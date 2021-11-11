import { get } from '@segment/actions-core'
// import { RequestFn } from '@segment/actions-core/dist/esm/destination-kit';
// import { Settings } from './generated-types';

// export async function lookupByEmail(request: RequestFn<Settings, unknown>, { payload, settings }: { payload: unknown, settings: Settings }) {
export async function searchPersonByEmail(email: string, request: any, domain: string): Promise<number | null> {
  const response = await request(`https://${domain}.pipedrive.com/api/v1/persons/search`, {
    method: 'get',
    searchParams: {
      term: email,
      fields: 'email'
    }
  })

  console.log('\nSuccess', {
    responseJSON: JSON.stringify(response),
    response
  });

  const personId = get<number>(response.data, 'data.items[0].item.id')

  return personId ? personId : null;
}

export async function searchPersonById(id: number, request: any, domain: string): Promise<number | null> {
  const response = await request(`https://${domain}.pipedrive.com/api/v1/persons/${id}`, {
    method: 'get',
  })

  console.log('\nSuccess', {
    responseJSON: JSON.stringify(response),
    response
  });

  const personId = get<number>(response.data, 'data.items[0].item.id')

  return personId ? personId : null;
}

export async function searchPersonByExternalIdInCustomField(
  customFieldKey: string,
  externalId: string,
  request: any,
  domain: string,
): Promise<number | null> {
  const response = await request(`https://${domain}.pipedrive.com/api/v1/itemSearch/field`, {
    method: 'get',
    searchParams: {
      field_type: 'personField',
      field_key: customFieldKey,
      term: externalId,
      exact_match: true,
      return_item_ids: true,
    }
  })

  console.log('\nSuccess', {
    responseJSON: JSON.stringify(response),
    response
  });

  const personId = get<number>(response.data, 'data[0].id')

  return personId ? personId : null;
}
