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