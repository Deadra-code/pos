import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Utensils } from 'lucide-react';
import { productsDb } from '@/db/operations';
import type { Product } from '@/db';
import { toast } from 'sonner';

const CATEGORIES = ['Makanan Berat', 'Minuman', 'Gorengan', 'Snack', 'Lainnya'];

export default function MenuManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productsDb.getAll();
    setProducts(data);
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Mohon isi semua field');
      return;
    }

    await productsDb.create({
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      is_available: true,
      sort_order: products.length,
    });

    toast.success('Menu berhasil ditambahkan');
    setFormData({ name: '', price: '', category: '' });
    setIsAddDialogOpen(false);
    loadProducts();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    await productsDb.update(editingProduct.id!, {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
    });

    toast.success('Menu berhasil diupdate');
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '' });
    loadProducts();
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Yakin ingin menghapus menu ini?')) {
      await productsDb.delete(id);
      toast.success('Menu berhasil dihapus');
      loadProducts();
    }
  };

  const handleToggleAvailability = async (id: number) => {
    await productsDb.toggleAvailability(id);
    loadProducts();
  };

  const handleQuickPriceEdit = (product: Product) => {
    setEditingPriceId(product.id!);
    setNewPrice(product.price.toString());
  };

  const handleSavePrice = async (id: number) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Harga tidak valid');
      return;
    }

    await productsDb.updatePrice(id, price);
    toast.success('Harga berhasil diupdate');
    setEditingPriceId(null);
    loadProducts();
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      handleSavePrice(id);
    } else if (e.key === 'Escape') {
      setEditingPriceId(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
    });
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Menu</h1>
            <p className="text-gray-600 mt-1">Kelola daftar menu warung Anda</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Menu Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi menu baru yang ingin ditambahkan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Menu</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Nasi Goreng"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="15000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddProduct}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingProduct}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProduct(null);
              setFormData({ name: '', price: '', category: '' });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu</DialogTitle>
              <DialogDescription>
                Update informasi menu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Menu</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Harga (Rp)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateProduct}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Daftar Menu ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Belum ada menu. Klik "Tambah Menu" untuk memulai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {editingPriceId === product.id ? (
                            <Input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              onBlur={() => handleSavePrice(product.id!)}
                              onKeyDown={(e) => handlePriceKeyDown(e, product.id!)}
                              className="w-24 h-8"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-blue-600 hover:underline"
                              onClick={() => handleQuickPriceEdit(product)}
                            >
                              Rp {product.price.toLocaleString('id-ID')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.is_available ? 'default' : 'secondary'}>
                            {product.is_available ? 'Tersedia' : 'Habis'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAvailability(product.id!)}
                            >
                              {product.is_available ? 'Habis' : 'Ada'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id!)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
