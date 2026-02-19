import { db } from './index';
import type { Product, Transaction } from './index';

// Settings operations
export const settingsDb = {
  async get(key: string): Promise<string | number | boolean | undefined> {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  async set(key: string, value: string | number | boolean): Promise<void> {
    await db.settings.put({ key, value });
  },

  async getAll(): Promise<Record<string, string | number | boolean>> {
    const settings = await db.settings.toArray();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  },
};

// Products operations
export const productsDb = {
  async getAll(): Promise<Product[]> {
    return await db.products.orderBy('sort_order').toArray();
  },

  async getById(id: number): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  async create(product: Omit<Product, 'id'>): Promise<number> {
    return await db.products.add(product) as number;
  },

  async update(id: number, product: Partial<Product>): Promise<void> {
    await db.products.update(id, product);
  },

  async delete(id: number): Promise<void> {
    await db.products.delete(id);
  },

  async toggleAvailability(id: number): Promise<void> {
    const product = await db.products.get(id);
    if (product) {
      await db.products.update(id, { is_available: !product.is_available });
    }
  },

  async updatePrice(id: number, price: number): Promise<void> {
    await db.products.update(id, { price });
  },

  async getAvailable(): Promise<Product[]> {
    return await db.products.where('is_available').equals(1).toArray();
  },

  async getByCategory(category: string): Promise<Product[]> {
    return await db.products.where('category').equals(category).toArray();
  },
};

// Transactions operations
export const transactionsDb = {
  async getAll(): Promise<Transaction[]> {
    return await db.transactions.reverse().sortBy('timestamp');
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async create(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    await db.transactions.add({ ...transaction, id } as Transaction);
    return id;
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.transactions
      .filter((t) => {
        const tDate = new Date(t.timestamp);
        return tDate >= startDate && tDate <= endDate;
      })
      .toArray();
  },

  async getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await this.getByDateRange(today, tomorrow);
  },
};
