'use strict';

const path = require('path');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const StorefrontService = require('../src/storefrontService');
const productApiClient = require('../src/productApiClient');

const pactConfig = {
  consumer: 'StorefrontService',
  provider: 'CatalogService',
  logLevel: 'info',
  log: path.resolve(__dirname, '..', 'logs', 'storefront-catalog.log'),
  dir: path.resolve(__dirname, '..', 'pacts'),
};

const productMatcher = {
  id: MatchersV3.integer(2),
  name: MatchersV3.like('Wireless Headphones'),
  description: MatchersV3.like('Noise cancelling over-ear headphones'),
  price: MatchersV3.decimal(249.5),
  inStock: MatchersV3.boolean(true),
};

describe('Storefront -> Catalog pact', () => {
  const provider = new PactV3(pactConfig);

  it('fetches product information needed to render a storefront view', async () => {
    await provider
      .given('product with ID 2 exists')
      .uponReceiving('a product lookup from the storefront service')
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
        const storefront = new StorefrontService({
          catalogClient: productApiClient,
          inventoryClient: {
            getAvailability: async () => ({
              productId: 2,
              inStock: true,
              quantity: 40,
              warehouses: ['SYD-AU'],
            }),
          },
          catalogBaseUrl: mockServer.url,
          inventoryBaseUrl: 'http://inventory.stub',
        });

        const overview = await storefront.getProductOverview(2);
        expect(overview).toEqual(
          expect.objectContaining({
            id: 2,
            name: expect.any(String),
            availability: expect.objectContaining({
              productId: 2,
              inStock: true,
              quantity: 40,
            }),
            canPurchase: true,
          })
        );
      });
  });
});
