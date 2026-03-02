export interface PatchOperation {
  op: 'add' | 'remove'
  path: '/visitors'
  value: string[]
}

export interface PatchBodyJSON {
  patch: PatchOperation[]
}

export interface BatchMultistatusItem {
  status: number
  message: string
  operation: 'add' | 'remove'
}

export interface BatchPatchResponse {
  multistatus: BatchMultistatusItem[]
}

export interface VisitorActionResponse {
  message: string
}

export type AddMap = Map<number, string>
export type RemoveMap = Map<number, string>
