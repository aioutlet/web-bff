/**
 * External Clients
 * Exports clients for external service communication
 */

export { default as daprClient } from './dapr.client.service.js';

// Service clients
export { authClient } from './auth.client.js';
export { userClient } from './user.client.js';
export { productClient } from './product.client.js';
export { cartClient } from './cart.client.js';
export { orderClient } from './order.client.js';
export { reviewClient } from './review.client.js';
export { adminClient } from './admin.client.js';
export { inventoryClient } from './inventory.client.js';
