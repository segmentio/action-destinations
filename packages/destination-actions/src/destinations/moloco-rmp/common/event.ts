import { InputField } from '@segment/actions-core/destination-kit/types'
import {
    EVENT_ID,
    TIMESTAMP,
    CHANNEL_TYPE,
    USER_ID,
    DEVICE,
    SESSION_ID,
    DECISION_TRACK_ID,
    items,
    revenue,
    searchQuery,
    pageId,
    referrerPageId,
    shippingCharge
} from './fields'
import { MolocoEventPayload } from './payload'

interface OptionalFieldsOption {
    requireItems?: boolean;
    requireRevenue?: boolean;
    requireSearchQuery?: boolean;
    requirePageId?: boolean;
    requireReferrerPageId?: boolean;
    requireShippingCharge?: boolean;
}

enum EventType {
    Search = 'SEARCH',
    ItemPageView = 'ITEM_PAGE_VIEW',
    AddToCart = 'ADD_TO_CART',
    Purchase = 'PURCHASE',
    AddToWhishlist = 'ADD_TO_WISHLIST',
    Home = 'HOME',
    Land = 'LAND',
    PageView = 'PAGE_VIEW'
}

export class MolocoEvent {
    eventType: EventType;

    // Common Fields; all events have these fields
    eventId: InputField = EVENT_ID;
    timestamp: InputField = TIMESTAMP;
    channelType: InputField = CHANNEL_TYPE;
    userId: InputField = USER_ID;
    device: InputField = DEVICE;
    sessionId: InputField = SESSION_ID;
    decisionTrackId: InputField = DECISION_TRACK_ID;

    // Optional Fields; some events have these fields as required or optional OR not at all
    items?: InputField;
    revenue?: InputField;
    searchQuery?: InputField;
    pageId?: InputField;
    referrerPageId?: InputField;
    shippingCharge?: InputField;

    // Constructor for MolocoEvent
    // If a field's requirement is not passed, it is not included in the event
    constructor(
        eventType: EventType,
        {
            requireItems = undefined,
            requireRevenue = undefined,
            requireSearchQuery = undefined,
            requirePageId = undefined,
            requireReferrerPageId = undefined,
            requireShippingCharge = undefined
        }: OptionalFieldsOption = {}
    ) {
        this.eventType = eventType;
        this.assignOptionalFields({
            requireItems,
            requireRevenue,
            requireSearchQuery,
            requirePageId,
            requireReferrerPageId,
            requireShippingCharge
        });
    }

    private assignOptionalFields(option: OptionalFieldsOption): void {
        this.items = option.requireItems !== null ? items(Boolean(option.requireItems)) : undefined;
        this.revenue = option.requireRevenue !== null ? revenue(Boolean(option.requireRevenue)) : undefined;
        this.searchQuery = option.requireSearchQuery !== null ? searchQuery(Boolean(option.requireSearchQuery)) : undefined;
        this.pageId = option.requirePageId !== null ? pageId(Boolean(option.requirePageId)) : undefined;
        this.referrerPageId = option.requireReferrerPageId !== null ? referrerPageId(Boolean(option.requireReferrerPageId)) : undefined;
        this.shippingCharge = option.requireShippingCharge !== null ? shippingCharge(Boolean(option.requireShippingCharge)) : undefined;
    }

    private getCommonFields(): Record<string, InputField> {
        return {
            eventId: this.eventId,
            timestamp: this.timestamp,
            channelType: this.channelType,
            userId: this.userId,
            device: this.device,
            sessionId: this.sessionId,
            decisionTrackId: this.decisionTrackId
        }
    }

    private getOptionalFields(): Record<string, InputField> {
        const optionalFields: Record<string, InputField> = {};

        if (this.items != undefined) {
            optionalFields.items = this.items;
        }

        if (this.revenue != undefined) {
            optionalFields.revenue = this.revenue;
        }

        if (this.searchQuery != undefined) {
            optionalFields.searchQuery = this.searchQuery;
        }

        if (this.pageId != undefined) {
            optionalFields.pageId = this.pageId;
        }

        if (this.referrerPageId != undefined) {
            optionalFields.referrerPageId = this.referrerPageId;
        }

        if (this.shippingCharge != undefined) {
            optionalFields.shippingCharge = this.shippingCharge;
        }

        return optionalFields
    }

    public getFields(): Record<string, InputField> {
        return {
            ...this.getCommonFields(),
            ...this.getOptionalFields()
        };
    }

    public buildJSONBody(payload: MolocoEventPayload): any {
        // TODO: build a json body from the payload
        return payload;
    }
}