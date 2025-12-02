'use strict';

class StorefrontService {
  constructor({ catalogClient, inventoryClient, catalogBaseUrl, inventoryBaseUrl }) {
    if (!catalogClient || !inventoryClient) {
      throw new Error('StorefrontService requires both catalogClient and inventoryClient!');
    }
    this.catalogClient = catalogClient;
    this.inventoryClient = inventoryClient;
    this.catalogBaseUrl = catalogBaseUrl;
    this.inventoryBaseUrl = inventoryBaseUrl;
  }

  async getProductOverview(productId) {
    const [product, availability] = await Promise.all([
      this.catalogClient.getProduct(this.catalogBaseUrl, productId),
      this.inventoryClient.getAvailability(this.inventoryBaseUrl, productId),
    ]);

    if (!product) {
      return null;
    }

    const normalizedAvailability = availability
      ? {
          productId: availability.productId,
          inStock: Boolean(availability.inStock),
          quantity: typeof availability.quantity === 'number' ? availability.quantity : 0,
          warehouses: Array.isArray(availability.warehouses) ? availability.warehouses : [],
        }
      : null;

    const canPurchase = Boolean(
      product.inStock &&
        normalizedAvailability &&
        normalizedAvailability.inStock &&
        normalizedAvailability.quantity > 0
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      inStock: Boolean(product.inStock),
      availability: normalizedAvailability,
      canPurchase,
    };
  }
}

module.exports = StorefrontService;
