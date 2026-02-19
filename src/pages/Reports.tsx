import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { transactionsDb } from '@/db/operations';
import type { Transaction } from '@/db';
import { TrendingUp, ShoppingBag, DollarSign, QrCode, Banknote, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getChartColor = (index: number) => {
    const el = document.documentElement;
    const style = getComputedStyle(el);
    return style.getPropertyValue(`--chart-${index + 1}`).trim() || COLORS[index % COLORS.length];
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await transactionsDb.getAll();
    setTransactions(data);
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filterType) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case '7days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
        else endDate = new Date();
        break;
    }

    return transactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      return tDate >= startDate && tDate <= endDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, customStartDate, customEndDate]);

  // Metrics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalTransactions = filteredTransactions.length;
  const averageBill = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Payment breakdown
  const cashTotal = filteredTransactions
    .filter((t) => t.payment_method === 'TUNAI')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const qrisTotal = filteredTransactions
    .filter((t) => t.payment_method === 'QRIS')
    .reduce((sum, t) => sum + t.total_amount, 0);

  // Top selling items
  const itemSales: Record<string, { qty: number; revenue: number }> = {};
  filteredTransactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!itemSales[item.product_name]) {
        itemSales[item.product_name] = { qty: 0, revenue: 0 };
      }
      itemSales[item.product_name].qty += item.qty;
      itemSales[item.product_name].revenue += item.price * item.qty;
    });
  });

  const topItemsByQty = Object.entries(itemSales)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  const topItemsByRevenue = Object.entries(itemSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  // Hourly sales data
  const hourlySales: Record<number, number> = {};
  filteredTransactions.forEach((t) => {
    const hour = new Date(t.timestamp).getHours();
    hourlySales[hour] = (hourlySales[hour] || 0) + t.total_amount;
  });

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    sales: hourlySales[i] || 0,
  }));

  // Payment breakdown data for pie chart
  const paymentData = [
    { name: 'Tunai', value: cashTotal },
    { name: 'QRIS', value: qrisTotal },
  ];

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      filterType,
      summary: {
        totalRevenue,
        totalTransactions,
        averageBill,
        cashTotal,
        qrisTotal,
      },
      topItemsByQty,
      topItemsByRevenue,
      transactions: filteredTransactions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-warung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Title
    doc.setFontSize(16);
    doc.text('Laporan Penjualan WarungPOS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${filterType.toUpperCase()} - ${dateStr}`, 14, 28);

    // Summary
    doc.setFontSize(12);
    doc.text('Ringkasan', 14, 38);
    doc.setFontSize(10);
    const summaryData = [
      ['Total Omzet', `Rp ${totalRevenue.toLocaleString('id-ID')}`],
      ['Total Transaksi', totalTransactions.toString()],
      ['Rata-rata Bill', `Rp ${Math.round(averageBill).toLocaleString('id-ID')}`],
      ['Total Tunai', `Rp ${cashTotal.toLocaleString('id-ID')}`],
      ['Total QRIS', `Rp ${qrisTotal.toLocaleString('id-ID')}`],
    ];

    autoTable(doc, {
      startY: 42,
      head: [['Metrik', 'Nilai']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Top Items
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Top 5 Menu Terlaris', 14, finalY);

    const topItemsData = topItemsByQty.map((item, idx) => [
      idx + 1,
      item.name,
      item.qty.toString(),
      `Rp ${item.revenue.toLocaleString('id-ID')}`,
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['#', 'Menu', 'Qty', 'Revenue']],
      body: topItemsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Transactions
    finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Riwayat Transaksi', 14, finalY);

    const transactionsData = filteredTransactions.map((t) => [
      t.invoice_number,
      new Date(t.timestamp).toLocaleString('id-ID'),
      t.payment_method,
      `Rp ${t.total_amount.toLocaleString('id-ID')}`,
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Invoice', 'Waktu', 'Metode', 'Total']],
      body: transactionsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { top: finalY + 4 },
    });

    doc.save(`laporan-warung-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Laporan Penjualan WarungPOS'],
      [`Periode: ${filterType.toUpperCase()}`],
      [],
      ['Ringkasan'],
      ['Total Omzet', `Rp ${totalRevenue.toLocaleString('id-ID')}`],
      ['Total Transaksi', totalTransactions],
      ['Rata-rata Bill', `Rp ${Math.round(averageBill).toLocaleString('id-ID')}`],
      ['Total Tunai', `Rp ${cashTotal.toLocaleString('id-ID')}`],
      ['Total QRIS', `Rp ${qrisTotal.toLocaleString('id-ID')}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Transactions Sheet
    const transactionsData = filteredTransactions.map((t) => ({
      Invoice: t.invoice_number,
      Tanggal: new Date(t.timestamp).toLocaleString('id-ID'),
      Metode: t.payment_method,
      Total: t.total_amount,
      Items: t.items.map((i) => `${i.product_name} (${i.qty})`).join('; '),
    }));
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transaksi');

    // Top Items Sheet
    const topItemsData = topItemsByQty.map((item) => ({
      Menu: item.name,
      Qty: item.qty,
      Revenue: item.revenue,
    }));
    const wsTopItems = XLSX.utils.json_to_sheet(topItemsData);
    XLSX.utils.book_append_sheet(wb, wsTopItems, 'Top Menu');

    XLSX.writeFile(wb, `laporan-warung-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const MetricCard = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) => (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className={`p-3 rounded-lg ${color.replace('bg-', 'bg-').replace('600', '100')} dark:${color.replace('bg-', 'bg-').replace('600', '900')}/20 mr-4`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')} dark:${color.replace('bg-', 'text-').replace('600', '400')}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
          <p className="text-muted-foreground mt-1">Analisis penjualan warung Anda</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportData}>
              <FileText className="w-4 h-4 mr-2" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Filter Periode</Label>
              <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mt-2">
                <TabsList>
                  <TabsTrigger value="today">Hari Ini</TabsTrigger>
                  <TabsTrigger value="yesterday">Kemarin</TabsTrigger>
                  <TabsTrigger value="7days">7 Hari</TabsTrigger>
                  <TabsTrigger value="month">Bulan Ini</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filterType === 'custom' && (
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Tanggal Akhir</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Total Omzet"
          value={`Rp ${totalRevenue.toLocaleString('id-ID')}`}
          icon={DollarSign}
          color="bg-green-600"
        />
        <MetricCard
          title="Total Transaksi"
          value={totalTransactions.toString()}
          icon={ShoppingBag}
          color="bg-blue-600"
        />
        <MetricCard
          title="Rata-rata Bill"
          value={`Rp ${Math.round(averageBill).toLocaleString('id-ID')}`}
          icon={TrendingUp}
          color="bg-purple-600"
        />
        <MetricCard
          title="Transaksi / Jam"
          icon={TrendingUp}
          color="bg-orange-600"
          value={(() => {
            const hourNow = new Date().getHours();
            const todayTransactions = transactions.filter((t) => {
              const tDate = new Date(t.timestamp);
              const now = new Date();
              return tDate.toDateString() === now.toDateString();
            });
            const hourlyAvg = hourNow > 0 ? todayTransactions.length / hourNow : 0;
            return hourlyAvg.toFixed(1);
          })()}
        />
      </div>

      {/* Payment Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Tunai
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              Rp {cashTotal.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Uang fisik yang harus ada di laci kasir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              QRIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              Rp {qrisTotal.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Uang yang masuk ke rekening/e-wallet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Jam</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => `Rp ${(value || 0).toLocaleString('id-ID')}`} />
                <Bar dataKey="sales" fill={`hsl(${getChartColor(0)})`} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: Rp ${(value || 0).toLocaleString('id-ID')}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${getChartColor(index)})`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => `Rp ${(value || 0).toLocaleString('id-ID')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Menu Terlaris (Qty)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Terjual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItemsByQty.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      Belum ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  topItemsByQty.map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Menu (Revenue)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItemsByRevenue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      Belum ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  topItemsByRevenue.map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        Rp {item.revenue.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Riwayat Transaksi</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="rowsPerPage" className="text-sm">Baris per halaman:</Label>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value: string) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20" id="rowsPerPage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Tidak ada transaksi pada periode ini
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.invoice_number}</TableCell>
                      <TableCell>
                        {new Date(t.timestamp).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${t.payment_method === 'TUNAI'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                          {t.payment_method}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {t.total_amount.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
