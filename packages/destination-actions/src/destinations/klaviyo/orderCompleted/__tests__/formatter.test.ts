import { formatOrderedProduct, formatProductItems, convertKeysToTitleCase } from '../formatters'
import { Product } from '../types'

describe('formatProductItems', () => {
  it('should format product items', () => {
    const product: Product = {
      product_id: 'product_id',
      sku: 'sku',
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore',
      array: ['value1', 'value2'],
      shippingAddress: {
        street: 'street',
        city: 'city',
        state: 'state',
        postalCode: 'postal_code',
        country: 'country',
        nested: {
          key: 'value'
        }
      }
    }

    expect(formatProductItems(product)).toEqual({
      ProductId: 'product_id',
      SKU: 'sku',
      ProductName: 'name',
      Quantity: 1,
      ItemPrice: 10,
      RowTotal: 10,
      Categories: ['category'],
      ProductURL: 'url',
      ImageURL: 'image_url',
      PropertyWithSpace: 'space',
      PropertyWithUnderscore: 'underscore',
      Array: ['value1', 'value2'],
      ShippingAddress: {
        Street: 'street',
        City: 'city',
        State: 'state',
        PostalCode: 'postal_code',
        Country: 'country',
        Nested: {
          key: 'value'
        }
      }
    })
  })
  it('should use id attribute for ProductId if product_id is not present', () => {
    const product: Product = {
      id: 'random_id',
      sku: 'sku',
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore'
    }

    const result = formatOrderedProduct(product)
    expect(result.productProperties.ProductId).toEqual('random_id')
  })
})

describe('formatOrderedProduct', () => {
  it('should format ordered product', () => {
    const product: Product = {
      product_id: 'product_id',
      sku: 'sku',
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore'
    }

    expect(formatOrderedProduct(product, 'order_id')).toEqual({
      unique_id: 'order_id_product_id',
      productProperties: {
        OrderId: 'order_id',
        ProductId: 'product_id',
        SKU: 'sku',
        ProductName: 'name',
        Quantity: 1,
        Categories: ['category'],
        ProductURL: 'url',
        ImageURL: 'image_url',
        PropertyWithSpace: 'space',
        PropertyWithUnderscore: 'underscore'
      }
    })
  })

  it('should use sku instead for unique_id if product_id is not present', () => {
    const product: Product = {
      sku: 'sku',
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore'
    }

    const result = formatOrderedProduct(product, 'order_id')
    expect(result.unique_id).toEqual('order_id_sku')
  })

  it('should use sku for  unique_id if product_id is not present', () => {
    const product: Product = {
      sku: 'sku',
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore'
    }

    const result = formatOrderedProduct(product, 'order_id')
    expect(result.unique_id).toEqual('order_id_sku')
  })

  it('should use id attribute for unique_id if product_id and sku are not present', () => {
    const product: Product = {
      id: 'random_id',
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore'
    }

    const result = formatOrderedProduct(product, 'order_id')
    expect(result.unique_id).toEqual('order_id_random_id')
  })

  it('should use random uuid for unique_id if product_id, sku and id are not present', () => {
    const product: Product = {
      name: 'name',
      quantity: 1,
      price: 10,
      category: 'category',
      url: 'url',
      image_url: 'image_url',
      'property with space': 'space',
      property_with_underscore: 'underscore'
    }

    const result = formatOrderedProduct(product, 'order_id')
    expect(result.unique_id).not.toContain('order_id')
  })
})

describe('convertKeysToTitleCase', () => {
  it('should convert keys to title case upt to 2 levels', () => {
    const obj = {
      key1: 'value1',
      key2: {
        key3: 'value3',
        key4: {
          key5: 'value5'
        }
      },
      key6: ['value6', 'value7']
    }

    expect(convertKeysToTitleCase(obj)).toEqual({
      Key1: 'value1',
      Key2: {
        Key3: 'value3',
        Key4: {
          key5: 'value5'
        }
      },
      Key6: ['value6', 'value7']
    })
  })
})
