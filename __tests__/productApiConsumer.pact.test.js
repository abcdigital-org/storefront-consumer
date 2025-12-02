'use strict';

const path = require('path');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { getProducts, getProduct } = require('../src/productApiClient');

const pactConfig = {
  consumer: 'ProductCatalogConsumer',
  provider: 'ProductCatalogService',
  logLevel: 'info',
  log: path.resolve(__dirname, '..', 'logs', 'product-catalog-consumer.log'),
  dir: path.resolve(__dirname, '..', 'pacts'),
};

const productMatcher = {
  id: MatchersV3.integer(1),
  name: MatchersV3.like('Coffee Machine'),
  description: MatchersV3.like('Freshly brewed coffee every morning'),
  price: MatchersV3.decimal(199.99),
  inStock: MatchersV3.boolean(true),
};

describe('Legacy catalog consumer pact', () => {
  const provider = new PactV3(pactConfig);

  describe('GET /products', () => {
    it('returns all available products', async () => {
      await provider
        .given('products exist')
        .uponReceiving('a request for the full product catalog')
        .withRequest({
          method: 'GET',
          path: '/products',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: MatchersV3.eachLike(productMatcher, 2),
        })
        .executeTest(async (mockServer) => {
          const products = await getProducts(mockServer.url);
          expect(Array.isArray(products)).toBe(true);
          expect(products.length).toBeGreaterThanOrEqual(2);
          expect(products[0]).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              description: expect.any(String),
              price: expect.any(Number),
              inStock: expect.any(Boolean),
            })
          );
        });
    });
  });

  describe('GET /products/:id', () => {
    it('returns the requested product when it exists', async () => {
      await provider
        .given('product with ID 2 exists')
        .uponReceiving('a request for a specific product')
        .withRequest({
          method: 'GET',
          path: '/products/2',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: productMatcher,
        })
        .executeTest(async (mockServer) => {
          const product = await getProduct(mockServer.url, 2);
          expect(product).toBeDefined();
          expect(product).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              description: expect.any(String),
              price: expect.any(Number),
              inStock: expect.any(Boolean),
            })
          );
        });
    });

    it('returns null when the product is missing', async () => {
      await provider
        .given('product with ID 999 does not exist')
        .uponReceiving('a request for a missing product')
        .withRequest({
          method: 'GET',
          path: '/products/999',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: MatchersV3.like({ message: 'Product not found' }),
        })
        .executeTest(async (mockServer) => {
          const product = await getProduct(mockServer.url, 999);
          expect(product).toBeNull();
        });
    });
  });
});
