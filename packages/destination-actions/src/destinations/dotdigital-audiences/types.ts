export interface CreateListJSON {
    name: string;
    visibility: 'Public'
}

export interface CreateListResp {
    id: number,
    name: string,
    visibility: 'Public'
}

export interface GetListResp {
    id: number,
    name: string,
    visibility: 'Public'
}