import { DaprBaseClient } from './dapr.base.client';
import config from '@/core/config';

export interface InventoryItem {
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: string;
}

export class InventoryClient extends DaprBaseClient {
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
