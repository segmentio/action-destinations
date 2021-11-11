import {Settings} from "./generated-types";
import type { RequestClient } from "@segment/actions-core/dist/esm/create-request-client";
import get from "lodash/get";

interface SearchFieldTypes {
  deal: 'dealField',
  person: 'personField'
  organization: 'organizationField',
  product: 'productField'
}

type ItemType = keyof SearchFieldTypes;

const searchFieldMap: SearchFieldTypes = {
  deal: 'dealField',
  person: "personField",
  product: "productField",
  organization: "organizationField"
}

interface SearchRequest<T extends ItemType> {
  term: string,
  field_type: SearchFieldTypes[T],
  exact_match: boolean,
  field_key: string,
}

class PipedriveClient {

  private settings: Settings;
  private _request: RequestClient;

  constructor(settings: Settings, request: RequestClient) {
    this.settings = settings;
    this._request = request;

  }

  async getId(item: ItemType, fieldName: string, term: string){
    const searchParams: SearchRequest<typeof item> = {
      term,
      field_key: fieldName,
      exact_match: true,
      field_type: searchFieldMap[item]
    }

    const search = await this._request(`https://${this.settings.domain}.pipedrive.com/api/v1/itemSearch/field`, {
      searchParams: {
        ...searchParams,
        exact_match: true,
        return_item_ids: true
      }
    });

    return get(search, 'data.data[0].id', null);
  }
}

export default PipedriveClient;
