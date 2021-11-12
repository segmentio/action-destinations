import { Settings } from "../generated-types";
import type { RequestClient } from "@segment/actions-core"
import get from "lodash/get";
import { ActivityTypes, PipedriveFields } from "./domain";
import { DynamicFieldResponse } from "@segment/actions-core";

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

interface PipedriveFieldTypes extends SearchFieldTypes {
  activity: 'activityFields',
  note: 'noteFields',
}

const pipedriveFieldMap: PipedriveFieldTypes = {
  ...searchFieldMap,
  activity: "activityFields",
  note: "noteFields",
}

interface SearchRequest<T extends ItemType> {
  term: string,
  field_type: SearchFieldTypes[T],
  exact_match: boolean,
  field_key: string,
}

const cache = {};

class PipedriveClient {

  private settings: Settings;
  private _request: RequestClient;

  constructor(settings: Settings, request: RequestClient) {
    this.settings = settings;
    this._request = request;
  }

  async getId(item: ItemType, fieldName: string, term: string): Promise<number | null> {
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

  async getFields(item: keyof PipedriveFieldTypes): Promise<DynamicFieldResponse> {
    const cachedFields = get(cache, item, []);
    if (cachedFields.length > 0) {
      return cachedFields;
    }
    const response = await this._request<PipedriveFields>(`https://${this.settings.domain}.pipedrive.com/api/v1/${pipedriveFieldMap[item]}`);
    const body = response.data;
    const fields = body.data.map(f => ({
      label: f.name,
      value: f.key,
    }));
    const record = {
      body: {
        data: fields,
        pagination: {}
      },
    };
    cachedFields[item] = record;
    return record;
  }

  async getActivityTypes(): Promise<DynamicFieldResponse> {
    const response = await this._request<ActivityTypes>(`https://${this.settings.domain}.pipedrive.com/api/v1/activityTypes`);
    const activityTypes = response.data;
    const fields = activityTypes.data.map(f => ({
      label: f.name,
      value: f.key_string,
    }));
    const record = {
      body: {
        data: fields,
        pagination: {}
      },
    };
    return record;
  }

}

export default PipedriveClient;
