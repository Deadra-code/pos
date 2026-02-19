import Dexie, { type Table } from 'dexie';

// Types for our database entities
export interface Setting {
  key: string;
  value: string | number | boolean;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  sort_order: number;
}

export interface TransactionItem {
  product_name: string;
  price: number;
  qty: number;
  note: string;
}

export interface Transaction {
  id?: string;
  invoice_number: string;
  timestamp: Date;
  total_amount: number;
  payment_method: 'TUNAI' | 'QRIS';
  cash_received?: number;
  change_amount?: number;
  items: TransactionItem[];
}

// Dexie database class
class WarungPosDB extends Dexie {
  settings!: Table<Setting, string>;
  products!: Table<Product, number>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super('WarungPosDB');

    this.version(1).stores({
      settings: 'key',
      products: '++id, name, category, is_available, sort_order',
      transactions: 'id, invoice_number, timestamp, payment_method',
    });
  }
}

export const db = new WarungPosDB();
