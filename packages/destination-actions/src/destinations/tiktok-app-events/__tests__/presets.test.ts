import { presets } from '../functions'

describe('Tiktok App Events', () => {
    it('should send a successful multi product event to reportAppEvent', async () => {
        const p = presets()

console.log(JSON.stringify(p, null, 2))

        const f = [
            {
                mapping: {},
                name: "Add payment information",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Payment Info Entered"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Add to cart",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Product Added"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Add to wishlist",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Product Added to Wishlist"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Place an order",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Checkout Started"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Install the app",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Application Installed"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Launch the app",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Application Opened"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Log in successfully",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Signed In"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Complete payment",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Order Completed"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Complete the registration",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Signed Up"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "Search",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Products Searched"',
                type: "automatic"
            },
            {
                mapping: {},
                name: "View details",
                partnerAction: "reportAppEvent",
                subscribe: 'event = "Product Viewed"',
                type: "automatic"
            }
        ]

        expect(p).toContainEqual(f)
    })
})
