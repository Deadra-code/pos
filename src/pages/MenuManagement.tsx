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
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Edit, Trash2, Utensils, CheckCheck, XCircle } from 'lucide-react';
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

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

    setIsSubmitting(true);
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
    setIsSubmitting(false);
    loadProducts();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setIsSubmitting(true);
    await productsDb.update(editingProduct.id!, {
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
    });

    toast.success('Menu berhasil diupdate');
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '' });
    setIsSubmitting(false);
    loadProducts();
  };

  const handleDeleteProduct = async (id: number) => {
    setProductToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete !== null) {
      await productsDb.delete(productToDelete);
      toast.success('Menu berhasil dihapus');
      loadProducts();
      setProductToDelete(null);
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

  // Bulk Actions
  const toggleSelectProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === products.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
      setSelectAll(false);
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id!).filter(Boolean)));
      setSelectAll(true);
    }
  };

  const handleBulkAvailability = async (available: boolean) => {
    if (selectedProducts.size === 0) {
      toast.error('Pilih menu terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    for (const id of selectedProducts) {
      const product = await productsDb.getById(id);
      if (product && product.is_available !== available) {
        await productsDb.update(id, { is_available: available });
      }
    }
    toast.success(`${selectedProducts.size} menu diupdate`);
    setSelectedProducts(new Set());
    setSelectAll(false);
    setIsSubmitting(false);
    loadProducts();
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) {
      toast.error('Pilih menu terlebih dahulu');
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    for (const id of selectedProducts) {
      await productsDb.delete(id);
    }
    toast.success(`${selectedProducts.size} menu dihapus`);
    setSelectedProducts(new Set());
    setSelectAll(false);
    setIsSubmitting(false);
    setProductToDelete(null);
    loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Menu</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar menu warung Anda</p>
        </div>
          <div className="flex gap-2">
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} terpilih
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAvailability(true)}
                  disabled={isSubmitting}
                  title="Tandai tersedia"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Ada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAvailability(false)}
                  disabled={isSubmitting}
                  title="Tandai habis"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Habis
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Hapus
                </Button>
              </div>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button aria-label="Add new menu item">
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Tambah Menu</span>
                  <span className="sm:hidden">Tambah</span>
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
                <Button onClick={handleAddProduct} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            <Button onClick={handleUpdateProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Mengupdate...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={selectedProducts.size > 0 ? 'Hapus Menu Bulk' : 'Hapus Menu'}
        description={
          selectedProducts.size > 0
            ? `Apakah Anda yakin ingin menghapus ${selectedProducts.size} menu yang terpilih? Tindakan ini tidak dapat dibatalkan.`
            : 'Apakah Anda yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan.'
        }
        onConfirm={selectedProducts.size > 0 ? confirmBulkDelete : confirmDeleteProduct}
        confirmText="Hapus"
        variant="destructive"
        isLoading={isSubmitting}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Daftar Menu ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll && products.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all products"
                    />
                  </TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada menu. Klik "Tambah Menu" untuk memulai.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id!)}
                          onCheckedChange={() => toggleSelectProduct(product.id!)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{product.category}</TableCell>
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
                            aria-label={`Edit price for ${product.name}`}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-primary hover:underline"
                            onClick={() => handleQuickPriceEdit(product)}
                            aria-label={`Edit price for ${product.name}, current price: Rp ${product.price.toLocaleString('id-ID')}`}
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
                            aria-label={product.is_available ? `Mark ${product.name} as unavailable` : `Mark ${product.name} as available`}
                          >
                            {product.is_available ? 'Habis' : 'Ada'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id!)}
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" aria-hidden="true" />
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
  );
}
