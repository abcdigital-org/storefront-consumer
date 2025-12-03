'use strict';

const path = require('path');
const { PactV4, MatchersV3 } = require('@pact-foundation/pact');
const StorefrontService = require('../src/storefrontService');
const availabilityApiClient = require('../src/availabilityApiClient');

const pactConfig = {
  consumer: 'StorefrontService',
  provider: 'InventoryService',
  logLevel: 'info',
  log: path.resolve(__dirname, '..', 'logs', 'storefront-inventory.log'),
  dir: path.resolve(__dirname, '..', 'pacts'),
};

const availabilityMatcher = {
  productId: MatchersV3.integer(2),
  inStock: MatchersV3.boolean(true),
  quantity: MatchersV3.integer(5),
  warehouses: MatchersV3.eachLike(MatchersV3.like('SYD-AU')),
};

describe('Storefront -> Inventory pact', () => {
  const pact = new PactV4(pactConfig);

  it('retrieves availability details to enrich the storefront view', async () => {
    await pact
      .addInteraction()
      .given('inventory for product ID 2 exists with quantity 5')
      .uponReceiving('an availability lookup from the storefront service')
      .withRequest('GET', '/inventory/2', (builder) => {
        builder.headers({ 'Accept': 'application/json' });
      })
      .willRespondWith(200, (builder) => {
        builder
          .headers({ 'Content-Type': 'application/json; charset=utf-8' })
          .jsonBody(availabilityMatcher);
      })
      .executeTest(async (mockServer) => {
        const storefront = new StorefrontService({
          catalogClient: {
            getProduct: async () => ({
              id: 2,
              name: 'Wireless Headphones',
              description: 'Noise cancelling over-ear headphones',
              price: 249.5,
              inStock: true,
            }),
          },
          inventoryClient: availabilityApiClient,
          catalogBaseUrl: 'http://catalog.stub',
          inventoryBaseUrl: mockServer.url,
        });

        const overview = await storefront.getProductOverview(2);
        expect(overview).toEqual(
          expect.objectContaining({
            id: 2,
            availability: expect.objectContaining({
              inStock: true,
              quantity: 5,
            }),
            canPurchase: true,
          })
        );
      });
  });
});
