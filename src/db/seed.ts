import { db, type Product, type Setting } from './index';

export const seedDatabase = async () => {
  // Check if already seeded
  const existingProducts = await db.products.count();
  if (existingProducts > 0) {
    return; // Already has data
  }

  // Default settings
  const settings: Setting[] = [
    { key: 'store_name', value: 'Warung Makan Enak' },
    { key: 'footer_struk', value: 'Terima kasih atas kunjungan Anda!\nSampai jumpa lagi!' },
  ];

  // Sample menu items
  const products: Product[] = [
    // Makanan Berat
    { id: 1, name: 'Nasi Goreng', price: 15000, category: 'Makanan Berat', is_available: true, sort_order: 1 },
    { id: 2, name: 'Nasi Goreng Spesial', price: 20000, category: 'Makanan Berat', is_available: true, sort_order: 2 },
    { id: 3, name: 'Nasi Putih', price: 5000, category: 'Makanan Berat', is_available: true, sort_order: 3 },
    { id: 4, name: 'Ayam Goreng', price: 18000, category: 'Makanan Berat', is_available: true, sort_order: 4 },
    { id: 5, name: 'Ayam Bakar', price: 20000, category: 'Makanan Berat', is_available: true, sort_order: 5 },
    { id: 6, name: 'Ikan Goreng', price: 17000, category: 'Makanan Berat', is_available: true, sort_order: 6 },
    { id: 7, name: 'Lele Goreng', price: 15000, category: 'Makanan Berat', is_available: true, sort_order: 7 },
    { id: 8, name: 'Mie Goreng', price: 14000, category: 'Makanan Berat', is_available: true, sort_order: 8 },
    { id: 9, name: 'Kwetiau Goreng', price: 15000, category: 'Makanan Berat', is_available: true, sort_order: 9 },
    { id: 10, name: 'Capcay', price: 18000, category: 'Makanan Berat', is_available: true, sort_order: 10 },
    { id: 11, name: 'Soto Ayam', price: 16000, category: 'Makanan Berat', is_available: true, sort_order: 11 },
    { id: 12, name: 'Bakso', price: 15000, category: 'Makanan Berat', is_available: true, sort_order: 12 },
    
    // Minuman
    { id: 13, name: 'Es Teh Manis', price: 4000, category: 'Minuman', is_available: true, sort_order: 13 },
    { id: 14, name: 'Es Teh Tawar', price: 3000, category: 'Minuman', is_available: true, sort_order: 14 },
    { id: 15, name: 'Teh Hangat', price: 3000, category: 'Minuman', is_available: true, sort_order: 15 },
    { id: 16, name: 'Es Jeruk', price: 6000, category: 'Minuman', is_available: true, sort_order: 16 },
    { id: 17, name: 'Jeruk Hangat', price: 6000, category: 'Minuman', is_available: true, sort_order: 17 },
    { id: 18, name: 'Es Campur', price: 10000, category: 'Minuman', is_available: true, sort_order: 18 },
    { id: 19, name: 'Es Kelapa', price: 8000, category: 'Minuman', is_available: true, sort_order: 19 },
    { id: 20, name: 'Kopi Hitam', price: 5000, category: 'Minuman', is_available: true, sort_order: 20 },
    { id: 21, name: 'Kopi Susu', price: 7000, category: 'Minuman', is_available: true, sort_order: 21 },
    { id: 22, name: 'Susu Coklat', price: 8000, category: 'Minuman', is_available: true, sort_order: 22 },
    { id: 23, name: 'Air Mineral', price: 4000, category: 'Minuman', is_available: true, sort_order: 23 },
    
    // Gorengan
    { id: 24, name: 'Tahu Goreng', price: 2000, category: 'Gorengan', is_available: true, sort_order: 24 },
    { id: 25, name: 'Tempe Goreng', price: 2000, category: 'Gorengan', is_available: true, sort_order: 25 },
    { id: 26, name: 'Bakwan', price: 2000, category: 'Gorengan', is_available: true, sort_order: 26 },
    { id: 27, name: 'Pisang Goreng', price: 3000, category: 'Gorengan', is_available: true, sort_order: 27 },
    { id: 28, name: 'Ubi Goreng', price: 3000, category: 'Gorengan', is_available: true, sort_order: 28 },
    { id: 29, name: 'Cireng', price: 2000, category: 'Gorengan', is_available: true, sort_order: 29 },
    { id: 30, name: 'Gehu', price: 2000, category: 'Gorengan', is_available: true, sort_order: 30 },
    { id: 31, name: 'Combro', price: 2000, category: 'Gorengan', is_available: true, sort_order: 31 },
    
    // Snack
    { id: 32, name: 'Kerupuk', price: 2000, category: 'Snack', is_available: true, sort_order: 32 },
    { id: 33, name: 'Emping', price: 3000, category: 'Snack', is_available: true, sort_order: 33 },
    { id: 34, name: 'Kentang Goreng', price: 8000, category: 'Snack', is_available: true, sort_order: 34 },
    { id: 35, name: 'Roti Bakar', price: 10000, category: 'Snack', is_available: true, sort_order: 35 },
    { id: 36, name: 'Martabak Manis', price: 25000, category: 'Snack', is_available: true, sort_order: 36 },
    
    // Lainnya
    { id: 37, name: 'Telur Dadar', price: 5000, category: 'Lainnya', is_available: true, sort_order: 37 },
    { id: 38, name: 'Telur Ceplok', price: 5000, category: 'Lainnya', is_available: true, sort_order: 38 },
    { id: 39, name: 'Telur Rebus', price: 4000, category: 'Lainnya', is_available: true, sort_order: 39 },
    { id: 40, name: 'Perkedel', price: 3000, category: 'Lainnya', is_available: true, sort_order: 40 },
    { id: 41, name: 'Sambal', price: 2000, category: 'Lainnya', is_available: true, sort_order: 41 },
    { id: 42, name: 'Lalapan', price: 3000, category: 'Lainnya', is_available: true, sort_order: 42 },
  ];

  await db.transaction('rw', db.settings, db.products, async () => {
    // Insert settings
    for (const setting of settings) {
      await db.settings.put(setting);
    }

    // Insert products (remove id for auto-increment)
    for (const product of products) {
      const { id, ...productWithoutId } = product;
      await db.products.add(productWithoutId);
    }
  });

  console.log('Database seeded successfully!');
};
