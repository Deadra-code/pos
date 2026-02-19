import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/db';
import { settingsDb, productsDb, transactionsDb } from '@/db/operations';
import { Download, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [storeName, setStoreName] = useState('');
  const [footerStruk, setFooterStruk] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const name = await settingsDb.get('store_name');
    const footer = await settingsDb.get('footer_struk');
    setStoreName((name as string) || 'WarungPOS');
    setFooterStruk((footer as string) || 'Terima kasih atas kunjungan Anda!');
  };

  const handleSaveSettings = async () => {
    await settingsDb.set('store_name', storeName);
    await settingsDb.set('footer_struk', footerStruk);
    toast.success('Pengaturan berhasil disimpan');
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
    if (confirm('Yakin ingin mereset semua data? Tindakan ini tidak dapat dibatalkan!')) {
      await db.transaction('rw', db.products, db.transactions, db.settings, async () => {
        await db.products.clear();
        await db.transactions.clear();
        await db.settings.clear();
      });
      toast.success('Semua data telah direset');
      setStoreName('WarungPOS');
      setFooterStruk('Terima kasih atas kunjungan Anda!');
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600 mt-1">Konfigurasi aplikasi dan manajemen data</p>
        </header>

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
              <Button onClick={handleSaveSettings}>
                <Save className="w-4 h-4 mr-2" />
                Simpan Pengaturan
              </Button>
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
                    <p className="text-sm text-gray-600 mb-4">
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
                    <p className="text-sm text-gray-600 mb-4">
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
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <span className="text-sm">Mengimport...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">Reset Data</h4>
                    <p className="text-sm text-red-600 mt-1">
                      Hapus semua data dan kembalikan aplikasi ke pengaturan awal. 
                      Pastikan sudah melakukan backup sebelum mereset!
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleReset}>
                    Reset Semua Data
                  </Button>
                </div>
              </div>
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
                  <dt className="text-gray-600">Versi</dt>
                  <dd className="font-medium">1.0 (Warung Makan Edition)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Platform</dt>
                  <dd className="font-medium">PWA Standalone</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Database</dt>
                  <dd className="font-medium">IndexedDB (Local Storage)</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Hosting</dt>
                  <dd className="font-medium">GitHub Pages</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
