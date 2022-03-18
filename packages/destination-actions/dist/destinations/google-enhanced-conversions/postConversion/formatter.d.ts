declare type DataValues = Record<string, string | string[] | number | undefined>
export declare function cleanData(data: DataValues): {
  [key: string]: unknown
}
export declare function formatEmail(email: string): string
export declare function formatPhone(phone?: string): string
export declare function formatFirstName(firstName?: string): string
export declare function formatLastName(lastName?: string): string
export declare function formatStreet(street?: string): string
export declare function formatCity(city?: string): string
export declare function formatRegion(region?: string): string
export {}
