import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { transactionsDb, productsDb } from '@/db/operations';
import type { Transaction } from '@/db';
import {
  ShoppingBag,
  Utensils,
  Receipt,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react';

export default function Dashboard() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableProducts, setAvailableProducts] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; qty: number }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load transactions
    const allTransactions = await transactionsDb.getAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTx = allTransactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      return tDate >= today;
    });

    const revenue = todayTx.reduce((sum, t) => sum + t.total_amount, 0);
    setTodayRevenue(revenue);
    setTodayTransactions(todayTx.length);
    setRecentTransactions(allTransactions.slice(0, 5));

    // Calculate top items
    const itemSales: Record<string, number> = {};
    todayTx.forEach((t) => {
      t.items.forEach((item) => {
        itemSales[item.product_name] = (itemSales[item.product_name] || 0) + item.qty;
      });
    });

    const topItemsList = Object.entries(itemSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));
    setTopItems(topItemsList);

    // Load products
    const products = await productsDb.getAll();
    setTotalProducts(products.length);
    setAvailableProducts(products.filter((p) => p.is_available).length);
  };

  const quickActions = [
    {
      title: 'Kasir',
      description: 'Buka halaman kasir',
      icon: ShoppingBag,
      link: '/kasir',
      color: 'bg-blue-500',
    },
    {
      title: 'Menu Habis',
      description: `${totalProducts - availableProducts} menu tidak tersedia`,
      icon: Utensils,
      link: '/menu',
      color: 'bg-green-500',
    },
    {
      title: 'Laporan Hari Ini',
      description: 'Lihat transaksi hari ini',
      icon: Receipt,
      link: '/laporan',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Ringkasan aktivitas warung Anda hari ini
          </p>
        </div>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-lg bg-green-100 mr-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Omzet Hari Ini</p>
              <p className="text-2xl font-bold">
                Rp {todayRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-lg bg-blue-100 mr-4">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transaksi</p>
              <p className="text-2xl font-bold">{todayTransactions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-lg bg-purple-100 mr-4">
              <Utensils className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Menu Tersedia</p>
              <p className="text-2xl font-bold">
                {availableProducts} / {totalProducts}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-lg bg-orange-100 mr-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata / Transaksi</p>
              <p className="text-2xl font-bold">
                {todayTransactions > 0
                  ? `Rp ${Math.round(todayRevenue / todayTransactions).toLocaleString('id-ID')}`
                  : 'Rp 0'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Top Items */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.link}>
                  <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Menu Terlaris Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada transaksi hari ini
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Menu</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topItems.map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell className="w-12">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {item.qty}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transaksi Terakhir
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/laporan">
                Lihat Semua
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada transaksi
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">
                        {t.invoice_number}
                      </TableCell>
                      <TableCell>
                        {new Date(t.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            t.payment_method === 'TUNAI'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.payment_method}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {t.total_amount.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
