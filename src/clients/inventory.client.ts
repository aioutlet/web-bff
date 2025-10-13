import { BaseClient } from './base.client';
import config from '@config/index';

export interface InventoryItem {
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: string;
}

export class InventoryClient extends BaseClient {
  constructor() {
    super(config.services.inventory, 'inventory-service');
  }

  async getInventory(sku: string): Promise<InventoryItem> {
    return this.get<InventoryItem>(`/api/inventory/${sku}`);
  }

  async getInventoryBatch(skus: string[]): Promise<InventoryItem[]> {
    return this.post<InventoryItem[]>('/api/inventory/batch', { skus });
  }
}

export const inventoryClient = new InventoryClient();
