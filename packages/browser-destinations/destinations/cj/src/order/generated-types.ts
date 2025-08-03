// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique ID assigned by you to the user.
   */
  userId?: string
  /**
   * Your CJ Enterprise ID.
   */
  enterpriseId: number
  /**
   * Page type to be sent to CJ.
   */
  pageType: string
  /**
   * Segment will ensure the email address is hashed before sending to CJ.
   */
  emailHash?: string
  /**
   * The orderId is a unique identifier, such as an order identifier or invoice number, which must be populated for each order.
   */
  orderId: string
  /**
   * Required if not specified in Settings. This is a static value provided by CJ. Each account may have multiple actions and each will be referenced by a different actionTrackerId value.
   */
  actionTrackerId?: string
  /**
   * The currency of the order, e.g. USD, EUR.
   */
  currency: string
  /**
   * The total amount of the order. This should exclude shipping or tax.
   */
  amount: number
  /**
   * The total discount applied to the order.
   */
  discount?: number
  /**
   * The coupon code applied to the order.
   */
  coupon?: string
  /**
   * The name of the cookie that stores the CJ Event ID. This is required whenever the advertiser uses their own cookie to store the Event ID.
   */
  cjeventOrderCookieName: string
  /**
   * The items to be sent to CJ.
   */
  items?: {
    /**
     * the price of the item before tax and discount.
     */
    unitPrice: number
    /**
     * The item sku.
     */
    itemId: string
    /**
     * The quantity of the item.
     */
    quantity: number
    /**
     * The discount applied to the item.
     */
    discount?: number
  }[]
  /**
   * This field is used to pass additional parameters specific to the vertical. All vertical parameters listed below can be utilized regardless of the account's vertical.
   */
  allVerticals?: {
    /**
     * Ancillary spend at the time of transaction, but not commissionable.
     */
    ancillarySpend?: number
    /**
     * Brand of items purchased. If there are multiple items with different brands, one brand must be designated for the order.
     */
    brand?: string
    /**
     * Identifier of brand of items purchased. If there are multiple items with different brands, one brand must be designated for the order.
     */
    brandId?: string
    /**
     * Identifies the business unit the customer purchased through. If there are multiple items with different business units, one business unit must be designated for the order.
     */
    businessUnit?: string
    /**
     * Marketing campaign id.
     */
    campaignId?: string
    /**
     * Marketing campaign name.
     */
    campaignName?: string
    /**
     * Category of items purchased. If there are multiple items with different categories, one category must be designated for the order.
     */
    category?: string
    /**
     * Class of item.
     */
    class?: string
    /**
     * Confirmation Number
     */
    confirmationNumber?: number
    /**
     * The value (amount of discount) of the coupon. This should be the number linked to the "coupon_type" parameter
     */
    couponDiscount?: number
    /**
     * The type of coupon used in the order. This should be the number linked to the "coupon_discount" parameter.
     */
    couponType?: string
    /**
     * The customer's country. ISO 3166-1 alpha 2 country code, eg. US, UK, AU, FR.
     */
    customerCountry?: string
    /**
     * Advertiser-specific customer segment definition.
     */
    customerSegment?: string
    /**
     * The status of the customer, e.g. new, returning.
     */
    customerStatus?: string
    /**
     * Indicates the type of individual making the purchase as someone representing a group.
     */
    customerType?: string
    /**
     * The delivery method used for the order.
     */
    delivery?: string
    /**
     * Description of the product.
     */
    description?: string
    /**
     * Duration in days.
     */
    duration?: number
    /**
     * End date and time of the order, in ISO 8601 format.
     */
    endDateTime?: string
    /**
     * Product genre. If there are multiple items with different genres, one genre must be designated for the order.
     */
    genre?: string
    /**
     * Id for the item. (Simple Actions Only).
     */
    itemId?: string
    /**
     * Advertiser assigned item name.
     */
    itemName?: string
    /**
     * Advertiser assigned item type.
     */
    itemType?: string
    /**
     * Advertiser assigned general demographic.
     */
    lifestage?: string
    /**
     * Identifies the customer location if different from customerCountry.
     */
    location?: string
    /**
     * Loyalty points earned on the transaction.
     */
    loyaltyEarned?: number
    /**
     * Indicates whether this order coincided with the consumer joining the loyalty program.
     */
    loyaltyFirstTimeSignup?: string
    /**
     * Indicates the level of the customer's loyalty status.
     */
    loyaltyLevel?: string
    /**
     * Loyalty points used during the transaction.
     */
    loyaltyRedeemed?: number
    /**
     * Indicates if the customer is a loyalty member.
     */
    loyaltyStatus?: string
    /**
     * Margin on total order. Can be a dollar value or a custom indicator.
     */
    margin?: string
    /**
     * Advertiser-defined marketing channel assigned to this transaction.
     */
    marketingChannel?: string
    /**
     * Indicates if the purchase has a no cancellation policy. "Yes" means there is a "no cancellation" policy, "no" means there is no policy.
     */
    noCancellation?: string
    /**
     * Subtotal for order.
     */
    orderSubtotal?: number
    /**
     * Method of payment.
     */
    paymentMethod?: string
    /**
     * Model of payment used; advertiser-specific.
     */
    paymentModel?: string
    /**
     * Device platform customer is using.
     */
    platformId?: string
    /**
     * Point of sale for the transaction.
     */
    pointOfSale?: string
    /**
     * Indicates if the purchase was made prior to the item becoming available.
     */
    preorder?: string
    /**
     * Indicates if the payment was made in advance of the item's consumption.
     */
    prepaid?: string
    /**
     * Promotion applied. If multiple, must be comma-separated.
     */
    promotion?: string
    /**
     * The numeric value associated with the promotion.
     */
    promotionAmount?: number
    /**
     * Threshold needed to qualify for the promotion.
     */
    promotionConditionThreshold?: number
    /**
     * Type of conditions applied to the promotion.
     */
    promotionConditionType?: string
    /**
     * End date of the promotion, in ISO 8601 format.
     */
    promotionEnds?: string
    /**
     * Start date of the promotion, in ISO 8601 format.
     */
    promotionStarts?: string
    /**
     * Category of promotion.
     */
    promotionType?: string
    /**
     * Quantity for a given SKU. (Simple Actions Only).
     */
    quantity?: number
    /**
     * Rating of the product.
     */
    rating?: string
    /**
     * Classification of service offered.
     */
    serviceType?: string
    /**
     * Start of item duration (e.g., check-out or departure date/time). Must be in ISO 8601 format.
     */
    startDateTime?: string
    /**
     * Cost of subscription fee featured when signing up for free trial.
     */
    subscriptionFee?: number
    /**
     * Product duration.
     */
    subscriptionLength?: string
    /**
     * Total tax for the order.
     */
    taxAmount?: number
    /**
     * Type of tax assessed.
     */
    taxType?: string
    /**
     * Indicates if someone converted from a trial to a subscription.
     */
    upsell?: string
  }
  /**
   * This field is used to pass additional parameters specific to the travel vertical.
   */
  travelVerticals?: {
    /**
     * Date the booking was made.
     */
    bookingDate?: string
    /**
     * Booking status at the time of tag firing.
     */
    bookingStatus?: string
    /**
     * Value of booking after taxes.
     */
    bookingValuePostTax?: number
    /**
     * Value of booking before taxes.
     */
    bookingValuePreTax?: number
    /**
     * Other items added to the reservation beyond the vehicle itself (e.g. "insurance", "GPS", "Car Seat").
     */
    carOptions?: string
    /**
     * Class of item (flight, hotel, car, or cruise specific classes).
     */
    class?: string
    /**
     * Type of cruise (Alaskan, Caribbean, etc...).
     */
    cruiseType?: string
    /**
     * Customer service destination city name (New York City, Boston, Atlanta, etc...). If destinationCity is provided, destinationState must also be provided. If there is no Origin/Destination combo, but needs to indicate a location of service (network service, event) use 'destination' set of parameters.
     */
    destinationCity?: string
    /**
     * Customer service destination country code, per ISO 3166-1 alpha 3 country code (USA, GBR, SWE, etc...).
     */
    destinationCountry?: string
    /**
     * Customer service destination state/province code. ISO 3166-2 country subdivision standards. e.g. US-NY, US-CA, US-FL, US-TX
     */
    destinationState?: string
    /**
     * Indicates whether the travel is domestic (Yes) or international (No).
     */
    domestic?: string
    /**
     * Destination location IATA code. 3 letter IATA code.
     */
    dropoffIata?: string
    /**
     * Advertiser ID for destination location.
     */
    dropoffId?: string
    /**
     * Type of flight fare (e.g. gotta get away).
     */
    flightFareType?: string
    /**
     * Other items added to the reservation (e.g. Wi-Fi).
     */
    flightOptions?: string
    /**
     * Type of flight (e.g. direct, layover, overnight).
     */
    flightType?: string
    /**
     * Flyer miles earned from this flight.
     */
    flyerMiles?: number
    /**
     * Number of guests.
     */
    guests?: number
    /**
     * IATA code (3-letter); If using for a multi-stop flight each city in a flight can be provided in a comma-separated list.
     */
    iata?: string
    /**
     * Booking itinerary ID.
     */
    itineraryId?: string
    /**
     * Minimum stay duration required in days.
     */
    minimumStayDuration?: number
    /**
     * Customer service origin city name (New York City, Ottawa, Los Angeles, etc...). If originCity is provided, originState is also provided
     */
    originCity?: string
    /**
     * Customer service origin country code per ISO 3166-1 alpha 3 country code (USA, GBR, SWE, etc...).
     */
    originCountry?: string
    /**
     * Customer service origin state/province code per ISO 3166-2 country subdivision standards (Alaska would be "or_state=US-AK", Bangkok would be "or_state=TH-10").
     */
    originState?: string
    /**
     * Amount paid at booking after taxes.
     */
    paidAtBookingPostTax?: number
    /**
     * Amount paid at booking before taxes.
     */
    paidAtBookingPreTax?: number
    /**
     * Origin location IATA code.
     */
    pickupIata?: string
    /**
     * Advertiser ID for origin location.
     */
    pickupId?: string
    /**
     * Departure port city (for cruises).
     */
    port?: string
    /**
     * Room type booked. If using the same values listed for "class" parameter, use that parameter instead.
     */
    roomType?: string
    /**
     * Number of rooms booked.
     */
    rooms?: number
    /**
     * Name of the cruise ship.
     */
    shipName?: string
    /**
     * 	Type of travel being booked. If you want access to standardized benchmark reporting, you must pass a value from the following list.
     */
    travelType?: string
  }
  /**
   * This field is used to pass additional parameters specific to the finance vertical.
   */
  financeVerticals?: {
    /**
     * Amount of the annual fee.
     */
    annualFee?: number
    /**
     * Identifies the status of the application at the time the transaction is sent to CJ.
     */
    applicationStatus?: string
    /**
     * APR at time of application approval.
     */
    apr?: number
    /**
     * APR for transfers.
     */
    aprTransfer?: number
    /**
     * If transfer APR is only for a certain period of time, pass the number of months here.
     */
    aprTransferTime?: number
    /**
     * Category of the card.
     */
    cardCategory?: string
    /**
     * Amount of the fee associated with the cash advance.
     */
    cashAdvanceFee?: number
    /**
     * Contract length, in months.
     */
    contractLength?: number
    /**
     * Advertiser-specific contract description.
     */
    contractType?: string
    /**
     * Indicates if the customer received a credit report and if it was purchased.
     */
    creditReport?: string
    /**
     * Amount of credit extended through product.
     */
    creditLine?: number
    /**
     * Minimum credit tier required for product approval. (300-579=Very Poor, 580-669=Fair, 670-739=Good,740-799=Very Good, 800-850=Exceptional).
     */
    creditQuality?: string
    /**
     * Indicates the amount of funding added to the account at the time of transaction.
     */
    fundedAmount?: number
    /**
     * Currency of the funding provided for the new account.
     */
    fundedCurrency?: number
    /**
     * The introductory APR amount. (If the intro APR is not different than overall APR, use the "APR" parameter).
     */
    introductoryApr?: number
    /**
     * The number of months the intro APR applies for.
     */
    introductoryAprTime?: number
    /**
     * Value of the minimum cash balance requirement for the account.
     */
    minimumBalance?: number
    /**
     * Indicates the value if a minimum deposit is required.
     */
    minimumDeposit?: number
    /**
     * Indicates if the applicant was pre-qualified for the card.
     */
    prequalify?: string
    /**
     * The transfer fee amount (i.e. for a credit card).
     */
    transferFee?: number
  }
  /**
   * This field is used to pass additional parameters specific to the network services vertical.
   */
  networkServicesVerticals?: {
    /**
     * Amount of the annual fee.
     */
    annualFee?: number
    /**
     * Identifies the status of the application at the time the transaction is sent to CJ.
     */
    applicationStatus?: string
    /**
     * Contract length, in months.
     */
    contractLength?: number
    /**
     * Advertiser-specific contract description.
     */
    contractType?: string
  }
}
