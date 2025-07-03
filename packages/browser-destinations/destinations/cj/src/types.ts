

export interface CJ {
  sitepage: (
    enterpriseId: number,
    pageType: string,
    referringChannel?: string,
    cartSubtotal?: number,
    items?: Item[],
    userId?: string
  ) => void
}

export interface Item {
    unitPrice: number
    itemId: string
    quantity: number
    discount?: number
}