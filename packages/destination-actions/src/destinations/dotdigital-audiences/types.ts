export interface CreateListJSON {
    name: string;
    visibility: VisibilityOption
}

export interface CreateListResp {
    id: number,
    name: string,
    visibility: VisibilityOption
}

export type VisibilityOption = 'Public' | 'Private'

export type GetDataFieldResponse = Array<DataFieldResponseItem>

export type DataFieldResponseItem = {
    name: string
    type: string
    visibility: VisibilityOption    
    defaultvalue: unknown
}