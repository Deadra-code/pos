import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { db } from '@/db';
import { settingsDb, productsDb, transactionsDb } from '@/db/operations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Download, Save, RotateCcw, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [storeName, setStoreName] = useState('');
  const [footerStruk, setFooterStruk] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const name = await settingsDb.get('store_name');
    const footer = await settingsDb.get('footer_struk');
    setStoreName((name as string) || 'WarungPOS');
    setFooterStruk((footer as string) || 'Terima kasih atas kunjungan Anda!');
    loadCategories();
  };

  const loadCategories = async () => {
    const products = await productsDb.getAll();
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
    setCategories(uniqueCategories);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      toast.error('Kategori sudah ada');
      return;
    }
    setCategories([...categories, newCategory.trim()]);
    setNewCategory('');
    toast.success('Kategori berhasil ditambahkan');
  };

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryValue(category);
  };

  const handleSaveCategory = async () => {
    if (!editCategoryValue.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    if (editCategoryValue.trim() !== editingCategory && categories.includes(editCategoryValue.trim())) {
      toast.error('Kategori sudah ada');
      return;
    }
    // Update all products with this category
    const products = await productsDb.getAll();
    for (const product of products) {
      if (product.category === editingCategory) {
        await productsDb.update(product.id!, { category: editCategoryValue.trim() });
      }
    }
    setCategories(categories.map((c) => (c === editingCategory ? editCategoryValue.trim() : c)));
    setEditingCategory(null);
    setEditCategoryValue('');
    toast.success('Kategori berhasil diupdate');
  };

  const handleDeleteCategory = async (category: string) => {
    const products = await productsDb.getAll();
    const productsInCategory = products.filter((p) => p.category === category);
    if (productsInCategory.length > 0) {
      toast.error(`Tidak dapat menghapus kategori yang masih memiliki ${productsInCategory.length} produk`);
      return;
    }
    setCategories(categories.filter((c) => c !== category));
    toast.success('Kategori berhasil dihapus');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await settingsDb.set('store_name', storeName);
    await settingsDb.set('footer_struk', footerStruk);
    toast.success('Pengaturan berhasil disimpan');
    setIsSaving(false);
  };

  const handleExport = async () => {
    const allProducts = await productsDb.getAll();
    const allTransactions = await transactionsDb.getAll();
    const allSettings = await settingsDb.getAll();

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: allSettings,
      products: allProducts,
      transactions: allTransactions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_warung_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Data berhasil di-export');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.products || !data.transactions) {
        throw new Error('Format file backup tidak valid');
      }

      // Clear existing data
      await db.transaction('rw', db.products, db.transactions, db.settings, async () => {
        await db.products.clear();
        await db.transactions.clear();
        await db.settings.clear();

        // Import products
        for (const product of data.products) {
          await db.products.add(product);
        }

        // Import transactions
        for (const transaction of data.transactions) {
          // Convert timestamp string back to Date
          transaction.timestamp = new Date(transaction.timestamp);
          await db.transactions.add(transaction);
        }

        // Import settings
        if (data.settings) {
          for (const [key, value] of Object.entries(data.settings) as [string, string | number | boolean][]) {
            await db.settings.put({ key, value });
          }
        }
      });

      toast.success('Data berhasil di-restore');
      loadSettings();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Gagal mengimport data. Pastikan file backup valid.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    setResetConfirmOpen(true);
  };

  const confirmReset = async () => {
    await db.transaction('rw', db.products, db.transactions, db.settings, async () => {
      await db.products.clear();
      await db.transactions.clear();
      await db.settings.clear();
    });
    toast.success('Semua data telah direset');
    setStoreName('WarungPOS');
    setFooterStruk('Terima kasih atas kunjungan Anda!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Konfigurasi aplikasi dan manajemen data</p>
      </div>

      <div className="space-y-6">
          {/* Store Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Toko</CardTitle>
              <CardDescription>
                Informasi dasar toko Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="storeName">Nama Toko</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="WarungPOS"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="footerStruk">Footer Struk</Label>
                <Input
                  id="footerStruk"
                  value={footerStruk}
                  onChange={(e) => setFooterStruk(e.target.value)}
                  placeholder="Terima kasih atas kunjungan Anda!"
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </CardContent>
          </Card>

          {/* Category Management */}
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Kategori</CardTitle>
              <CardDescription>
                Kelola kategori menu untuk mengorganisir produk Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nama kategori baru..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1"
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada kategori
                  </p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editCategoryValue}
                            onChange={(e) => setEditCategoryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCategory();
                              if (e.key === 'Escape') {
                                setEditingCategory(null);
                                setEditCategoryValue('');
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveCategory}>
                            Simpan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditCategoryValue('');
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                              {category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>
                Export atau import data warung Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Export Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download semua data menu dan riwayat transaksi sebagai file JSON.
                    </p>
                    <Button onClick={handleExport} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Backup
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Import Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Restore data dari file backup JSON yang pernah di-export.
                    </p>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        disabled={isImporting}
                        className="cursor-pointer"
                      />
                      {isImporting && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="text-sm">Mengimport...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 dark:text-red-200">Reset Data</h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Hapus semua data dan kembalikan aplikasi ke pengaturan awal.
                      Pastikan sudah melakukan backup sebelum mereset!
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleReset}>
                    Reset Semua Data
                  </Button>
                </div>
              </div>

              {/* Reset Confirmation Dialog */}
              <ConfirmDialog
                open={resetConfirmOpen}
                onOpenChange={setResetConfirmOpen}
                title="Reset Semua Data"
                description="Apakah Anda yakin ingin mereset semua data? Tindakan ini tidak dapat dibatalkan. Pastikan sudah melakukan backup sebelum mereset!"
                onConfirm={confirmReset}
                confirmText="Reset Semua Data"
                variant="destructive"
                isLoading={isSaving}
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Aplikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Versi</dt>
                  <dd className="font-medium">1.0 (Warung Makan Edition)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Platform</dt>
                  <dd className="font-medium">PWA Standalone</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Database</dt>
                  <dd className="font-medium">IndexedDB (Local Storage)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Hosting</dt>
                  <dd className="font-medium">GitHub Pages</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
