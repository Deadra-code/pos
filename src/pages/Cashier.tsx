import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { productsDb, transactionsDb } from '@/db/operations';
import type { Product, TransactionItem } from '@/db';
import { ShoppingBag, Plus, Minus, Trash2, CreditCard, QrCode, Banknote } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem extends TransactionItem {
  id?: number;
}

export default function Cashier() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'QRIS'>('TUNAI');
  const [cashReceived, setCashReceived] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productsDb.getAvailable();
    setProducts(data);
  };

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const addToCart = (product: Product, itemNote: string = '') => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product_name === product.name && item.note === itemNote
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].qty += 1;
        return newCart;
      }

      return [
        ...prev,
        {
          product_name: product.name,
          price: product.price,
          qty: 1,
          note: itemNote,
        },
      ];
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const newCart = [...prev];
      newCart[index].qty += delta;
      if (newCart[index].qty <= 0) {
        return newCart.filter((_, i) => i !== index);
      }
      return newCart;
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setNote('');
    setIsNoteDialogOpen(true);
  };

  const handleAddWithNote = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, note);
      setIsNoteDialogOpen(false);
      toast.success(`${selectedProduct.name} ditambahkan ke keranjang`);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `W-${dateStr}-${randomNum}`;
  };

  const handlePayment = async () => {
    if (paymentMethod === 'TUNAI') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < totalAmount) {
        toast.error('Uang diterima tidak mencukupi');
        return;
      }

      const change = received - totalAmount;

      await transactionsDb.create({
        invoice_number: generateInvoiceNumber(),
        timestamp: new Date(),
        total_amount: totalAmount,
        payment_method: 'TUNAI',
        cash_received: received,
        change_amount: change,
        items: cart,
      });

      toast.success(`Pembayaran berhasil! Kembalian: Rp ${change.toLocaleString('id-ID')}`);
    } else {
      await transactionsDb.create({
        invoice_number: generateInvoiceNumber(),
        timestamp: new Date(),
        total_amount: totalAmount,
        payment_method: 'QRIS',
        items: cart,
      });

      toast.success('Pembayaran QRIS berhasil!');
    }

    setCart([]);
    setIsPaymentDialogOpen(false);
    setCashReceived('');
    setPaymentMethod('TUNAI');
  };

  const presetCashAmounts = [10000, 20000, 50000, 100000];

  const CartContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Keranjang kosong</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      {item.note && (
                        <p className="text-xs text-gray-500">Catatan: {item.note}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {item.qty} x Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(index, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.qty}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {cart.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <Button className="w-full" size="lg" onClick={handleCheckout}>
            <CreditCard className="w-5 h-5 mr-2" />
            Bayar
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catatan untuk {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Tambahkan catatan khusus untuk pesanan ini (opsional).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Contoh: Pedas, Jangan pakai bawang, Bungkus..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddWithNote}>Tambah ke Keranjang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
            <DialogDescription>
              Pilih metode pembayaran dan selesaikan transaksi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-100 rounded-lg">
              <span className="font-semibold">Total Tagihan</span>
              <span className="text-2xl font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>

            <div className="mb-6">
              <Label className="mb-2 block">Metode Pembayaran</Label>
              <ToggleGroup
                type="single"
                value={paymentMethod}
                onValueChange={(value) => value && setPaymentMethod(value as 'TUNAI' | 'QRIS')}
                className="w-full"
              >
                <ToggleGroupItem value="TUNAI" className="flex-1" asChild>
                  <Button variant="outline" className="w-full">
                    <Banknote className="w-4 h-4 mr-2" />
                    Tunai
                  </Button>
                </ToggleGroupItem>
                <ToggleGroupItem value="QRIS" className="flex-1" asChild>
                  <Button variant="outline" className="w-full">
                    <QrCode className="w-4 h-4 mr-2" />
                    QRIS
                  </Button>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {paymentMethod === 'TUNAI' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cashReceived">Uang Diterima (Rp)</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Preset</Label>
                  <div className="flex gap-2 flex-wrap">
                    {presetCashAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setCashReceived(amount.toString())}
                      >
                        {(amount / 1000)}k
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived(totalAmount.toString())}
                    >
                      Uang Pas
                    </Button>
                  </div>
                </div>

                {cashReceived && !isNaN(parseFloat(cashReceived)) && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-800">Kembalian</span>
                    <span className="text-green-800 font-semibold">
                      Rp {Math.max(0, parseFloat(cashReceived) - totalAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'QRIS' && (
              <div className="text-center py-4">
                <QrCode className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Pastikan pembayaran QRIS sudah diverifikasi secara visual.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handlePayment}>
              Selesaikan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Menu Section */}
        <div className="flex-1 p-4 overflow-auto">
          <header className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Kasir</h1>
            <p className="text-gray-600">Pilih menu untuk pesanan</p>
          </header>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-4 overflow-x-auto">
              <TabsTrigger value="all">Semua</TabsTrigger>
              {categories.filter((c) => c !== 'all').map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProductClick(product)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                      <p className="text-blue-600 font-semibold mt-1">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Cart Section - Desktop */}
        <div className="hidden md:block w-96 border-l bg-white p-4">
          <h2 className="text-xl font-bold mb-4">Keranjang</h2>
          <CartContent />
        </div>

        {/* Mobile Cart Button */}
        <div className="md:hidden fixed bottom-4 right-4">
          <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg">
                <ShoppingBag className="w-5 h-5 mr-2" />
                <Badge variant="secondary" className="ml-1">
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Keranjang</SheetTitle>
              </SheetHeader>
              <div className="mt-4 h-full">
                <CartContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
