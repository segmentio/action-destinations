import { IntegrationError } from "@segment/actions-core";

type PayloadWithCustomFields = { custom_fields?: string };

export function addCustomFieldsFromPayloadToEntity<E>(
  payload: PayloadWithCustomFields,
  entity: E,
) {
  if (!payload.custom_fields) {
    return;
  }
  try {
    const customFields = JSON.parse(payload.custom_fields);
    Object.assign(entity, customFields);
  } catch (e) {
    throw new IntegrationError(
      'Custom fields JSON parse error.',
      'JSON_PARSE_ERROR',
      400
    );
  }
}
