import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction } from '@/db';

interface ReceiptPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  storeName: string;
  footerStruk: string;
}

export function ReceiptPrintDialog({
  open,
  onOpenChange,
  transaction,
  storeName,
  footerStruk,
}: ReceiptPrintDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      // Auto-print when dialog opens (optional)
      // handlePrint();
    }
  }, [open]);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleCopyText = () => {
    if (!transaction) return;

    const receiptText = generateReceiptText(transaction, storeName, footerStruk);
    navigator.clipboard.writeText(receiptText);
    toast.success('Struk berhasil disalin ke clipboard');
  };

  if (!transaction) return null;

  const date = new Date(transaction.timestamp);
  const dateStr = date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cetak Struk</DialogTitle>
          <DialogDescription>
            Preview dan cetak struk transaksi
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} disabled={isPrinting} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? 'Mencetak...' : 'Cetak'}
          </Button>
          <Button variant="outline" onClick={handleCopyText} className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            Salin Teks
          </Button>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="border rounded-lg p-4 bg-white text-black font-mono text-sm">
            {/* Receipt Content */}
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg">{storeName}</h2>
              <p className="text-xs text-gray-600">{dateStr} {timeStr}</p>
              <p className="text-xs text-gray-600">No: {transaction.invoice_number}</p>
            </div>

            <div className="border-t border-b py-2 mb-2">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="py-1">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">
                        <div>{item.product_name}</div>
                        {item.note && (
                          <div className="text-xs text-gray-600">- {item.note}</div>
                        )}
                        <div className="text-xs text-gray-600">
                          {item.qty} x Rp {item.price.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-right">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {transaction.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>Rp {transaction.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Metode Pembayaran</span>
                <span>{transaction.payment_method}</span>
              </div>
              {transaction.payment_method === 'TUNAI' && (
                <>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Uang Diterima</span>
                    <span>Rp {transaction.cash_received?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Kembalian</span>
                    <span>Rp {transaction.change_amount?.toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center pt-2 border-t">
              <p className="text-xs whitespace-pre-line">{footerStruk}</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateReceiptText(
  transaction: Transaction,
  storeName: string,
  footerStruk: string
): string {
  const date = new Date(transaction.timestamp);
  const dateStr = date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = `${storeName}\n`;
  text += `${dateStr} ${timeStr}\n`;
  text += `No: ${transaction.invoice_number}\n\n`;
  text += '================================\n\n';

  transaction.items.forEach((item) => {
    text += `${item.product_name}\n`;
    if (item.note) {
      text += `  - ${item.note}\n`;
    }
    text += `  ${item.qty} x Rp ${item.price.toLocaleString('id-ID')} = `;
    text += `Rp ${(item.price * item.qty).toLocaleString('id-ID')}\n\n`;
  });

  text += '--------------------------------\n';
  text += `Total: Rp ${transaction.total_amount.toLocaleString('id-ID')}\n`;
  text += `Pembayaran: ${transaction.payment_method}\n`;

  if (transaction.payment_method === 'TUNAI' && transaction.cash_received) {
    text += `Uang Diterima: Rp ${transaction.cash_received.toLocaleString('id-ID')}\n`;
    if (transaction.change_amount) {
      text += `Kembalian: Rp ${transaction.change_amount.toLocaleString('id-ID')}\n`;
    }
  }

  text += '\n================================\n';
  text += footerStruk;

  return text;
}
