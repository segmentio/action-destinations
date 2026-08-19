import { HS_OBJECT_ID } from '../constants'

/**
 * Returns the idProperty to spread into a batch object request, or nothing when the identifier is
 * hs_object_id.
 *
 * hs_object_id is HubSpot's internal record id rather than a unique property, so the batch read and
 * update endpoints reject it as an idProperty. Omitting idProperty makes HubSpot resolve the `id`
 * field as the record id, which is what hs_object_id holds.
 */
export function maybeIdProperty(idFieldName: string): { idProperty?: string } {
  return idFieldName === HS_OBJECT_ID ? {} : { idProperty: idFieldName }
}
