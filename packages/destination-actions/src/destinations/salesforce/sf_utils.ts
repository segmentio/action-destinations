export const buildQuery = (trait_field: string, trait_value: string, sobject: string): string => {
  // TODO: Expand this
  return `SELECT Id FROM ${sobject} WHERE ${trait_field} = '${trait_value}'`
}
